import os
import json
import time
import re
import urllib.request
import urllib.error
from typing import Dict, List, Any, Optional, Tuple
from app.config import settings

class Judge0Service:
    def __init__(self):
        self.base_url = (os.getenv("JUDGE0_BASE_URL") or getattr(settings, "JUDGE0_BASE_URL", "https://ce.judge0.com")).rstrip('/')
        self.auth_token = os.getenv("JUDGE0_AUTH_TOKEN") or getattr(settings, "JUDGE0_AUTH_TOKEN", "")
        
        self.headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        if self.auth_token:
            self.headers["X-Auth-Token"] = self.auth_token
            self.headers["X-RapidAPI-Key"] = self.auth_token

    def reload_config(self):
        """Reload base URL and headers dynamically from environment/settings."""
        self.base_url = (os.getenv("JUDGE0_BASE_URL") or getattr(settings, "JUDGE0_BASE_URL", "https://ce.judge0.com")).rstrip('/')
        self.auth_token = os.getenv("JUDGE0_AUTH_TOKEN") or getattr(settings, "JUDGE0_AUTH_TOKEN", "")
        self.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        if self.auth_token:
            self.headers["X-Auth-Token"] = self.auth_token
            self.headers["X-RapidAPI-Key"] = self.auth_token

    def check_health(self) -> dict:
        """Verify Judge0 service reachability and health status."""
        self.reload_config()
        # Try /about, /health, or /languages
        for path in ["/about", "/health", "/languages"]:
            try:
                url = f"{self.base_url}{path}"
                req = urllib.request.Request(url, headers=self.headers, method="GET")
                with urllib.request.urlopen(req, timeout=4.0) as response:
                    data = json.loads(response.read().decode("utf-8"))
                    return {"status": "ok", "base_url": self.base_url, "details": data}
            except Exception:
                continue
        return {
            "status": "error",
            "base_url": self.base_url,
            "message": f"Unable to reach Judge0 endpoint at {self.base_url}. Please check JUDGE0_BASE_URL configuration."
        }

    def get_languages(self) -> List[Dict[str, Any]]:
        """Fetch active supported programming languages directly from Judge0."""
        self.reload_config()
        try:
            url = f"{self.base_url}/languages"
            req = urllib.request.Request(url, headers=self.headers, method="GET")
            with urllib.request.urlopen(req, timeout=5.0) as response:
                langs = json.loads(response.read().decode("utf-8"))
                cleaned = []
                for l in langs:
                    if isinstance(l, dict) and "id" in l and "name" in l:
                        cleaned.append({
                            "id": l["id"],
                            "name": l["name"],
                            "key": self._slugify(l["name"])
                        })
                return cleaned if cleaned else self._default_languages()
        except Exception as e:
            print(f"Notice: Judge0 get_languages fallback used ({e})")
            return self._default_languages()

    def execute_code(
        self,
        source_code: str,
        language_id: int,
        stdin: str = "",
        expected_output: Optional[str] = None,
        cpu_time_limit: float = 5.0,
        memory_limit: int = 128000
    ) -> Dict[str, Any]:
        """Submit code execution to Judge0 and poll for final result."""
        self.reload_config()
        start_time = time.time()

        # For Java (ID 62 / 91), ensure public class name is Main
        normalized_code = source_code
        if language_id in [62, 91]:
            match = re.search(r'public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)', source_code)
            if match and match.group(1) != "Main":
                normalized_code = re.sub(r'public\s+class\s+' + match.group(1), 'public class Main', source_code)

        payload = {
            "source_code": normalized_code,
            "language_id": language_id,
            "stdin": stdin,
            "cpu_time_limit": cpu_time_limit,
            "memory_limit": memory_limit
        }
        if expected_output is not None:
            payload["expected_output"] = expected_output

        try:
            url = f"{self.base_url}/submissions?wait=true"
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=self.headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10.0) as response:
                raw_res = json.loads(response.read().decode("utf-8"))
                
                # Check if submission needs polling (status id 1: In Queue, 2: Processing)
                status_id = raw_res.get("status", {}).get("id", 0)
                token = raw_res.get("token")
                
                if (status_id in [1, 2] or not status_id) and token:
                    raw_res = self._poll_submission(token)

                elapsed = round(time.time() - start_time, 3)
                return self.normalize_result(raw_res, elapsed)

        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8") if e.fp else str(e)
            return {
                "success": False,
                "status": "API Network Error",
                "stdout": "",
                "stderr": f"Judge0 Compiler API Error (HTTP {e.code}): {err_body}",
                "compileOutput": None,
                "time": "0.00s",
                "memory": 0
            }
        except Exception as ex:
            return {
                "success": False,
                "status": "API Network Error",
                "stdout": "",
                "stderr": f"Judge0 compiler service connection failed ({str(ex)}). Endpoint: {self.base_url}",
                "compileOutput": None,
                "time": "0.00s",
                "memory": 0
            }

    def _poll_submission(self, token: str, max_attempts: int = 15, delay: float = 0.4) -> Dict[str, Any]:
        """Poll Judge0 submission token until completed."""
        url = f"{self.base_url}/submissions/{token}?base64_encoded=false"
        for _ in range(max_attempts):
            time.sleep(delay)
            try:
                req = urllib.request.Request(url, headers=self.headers, method="GET")
                with urllib.request.urlopen(req, timeout=5.0) as response:
                    raw_res = json.loads(response.read().decode("utf-8"))
                    status_id = raw_res.get("status", {}).get("id", 0)
                    if status_id >= 3:
                        return raw_res
            except Exception:
                continue
        return {"status": {"id": 13, "description": "Time Limit Exceeded (Polling Timeout)"}, "token": token}

    def execute_batch(self, submissions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Submit batch executions to Judge0 for hidden test cases evaluation."""
        self.reload_config()
        if not submissions:
            return []

        # Normalize code in batch items
        for sub in submissions:
            if sub.get("language_id") in [62, 91]:
                src = sub.get("source_code", "")
                match = re.search(r'public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)', src)
                if match and match.group(1) != "Main":
                    sub["source_code"] = re.sub(r'public\s+class\s+' + match.group(1), 'public class Main', src)

        payload = {"submissions": submissions}
        try:
            url = f"{self.base_url}/submissions/batch?wait=true"
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=self.headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=15.0) as response:
                batch_res = json.loads(response.read().decode("utf-8"))
                
                # Check tokens in case polling is needed
                tokens_to_poll = []
                results = []
                for sub_res in batch_res:
                    tok = sub_res.get("token")
                    st_id = sub_res.get("status", {}).get("id", 0)
                    if (st_id in [1, 2] or not st_id) and tok:
                        tokens_to_poll.append(tok)
                    else:
                        results.append(self.normalize_result(sub_res, 0.05))

                if tokens_to_poll:
                    # Fetch batch status by tokens
                    tokens_str = ",".join(tokens_to_poll)
                    poll_url = f"{self.base_url}/submissions/batch?tokens={tokens_str}&base64_encoded=false"
                    for _ in range(15):
                        time.sleep(0.4)
                        try:
                            p_req = urllib.request.Request(poll_url, headers=self.headers, method="GET")
                            with urllib.request.urlopen(p_req, timeout=5.0) as p_resp:
                                p_data = json.loads(p_resp.read().decode("utf-8"))
                                sub_list = p_data.get("submissions", p_data)
                                if all(s.get("status", {}).get("id", 0) >= 3 for s in sub_list):
                                    return [self.normalize_result(s, 0.05) for s in sub_list]
                        except Exception:
                            continue

                if results:
                    return results

        except Exception as e:
            print("Notice: Batch submission fallback to sequential execution:", e)

        # Sequential execution fallback directly via Judge0
        results = []
        for sub in submissions:
            res = self.execute_code(
                source_code=sub.get("source_code", ""),
                language_id=sub.get("language_id", 62),
                stdin=sub.get("stdin", ""),
                expected_output=sub.get("expected_output")
            )
            results.append(res)
        return results

    def normalize_result(self, raw: Dict[str, Any], default_time: float) -> Dict[str, Any]:
        """Normalize raw Judge0 JSON response into standardized TAP structure."""
        status_info = raw.get("status", {})
        status_id = status_info.get("id", 0)
        status_desc = status_info.get("description", "Unknown")

        stdout = (raw.get("stdout") or "").rstrip()
        stderr = (raw.get("stderr") or "").rstrip()
        compile_output = (raw.get("compile_output") or "").rstrip()
        message = (raw.get("message") or "").rstrip()

        exec_time = raw.get("time") or str(default_time)
        exec_memory = raw.get("memory") or 0

        # Map status IDs per Judge0 Spec:
        # 1: In Queue, 2: Processing, 3: Accepted, 4: Wrong Answer, 5: Time Limit Exceeded
        # 6: Compilation Error, 7-12: Runtime Errors, 13: Internal Error, 14: Exec Format Error
        if status_id == 3 or status_desc == "Accepted":
            tap_status = "Accepted"
            is_success = True
        elif status_id == 4 or status_desc == "Wrong Answer":
            tap_status = "Wrong Answer"
            is_success = False
        elif status_id == 5 or "Time Limit" in status_desc:
            tap_status = "Time Limit Exceeded"
            is_success = False
        elif status_id == 6 or "Compilation" in status_desc:
            tap_status = "Compilation Error"
            is_success = False
        elif status_id in [7, 8, 9, 10, 11, 12, 14] or "Runtime Error" in status_desc:
            tap_status = "Runtime Error"
            is_success = False
        elif status_id == 13 or "Internal" in status_desc:
            tap_status = "Internal Error"
            is_success = False
        else:
            tap_status = status_desc if status_desc else "Execution Completed"
            is_success = (status_id == 3)

        formatted_time = f"{exec_time}s" if not str(exec_time).endswith('s') else str(exec_time)

        return {
            "success": is_success,
            "status": tap_status,
            "statusId": status_id,
            "stdout": stdout,
            "stderr": stderr if stderr else (message if message else None),
            "compileOutput": compile_output if compile_output else None,
            "time": formatted_time,
            "memory": exec_memory,
            "judge0Token": raw.get("token")
        }

    def _slugify(self, text: str) -> str:
        return re.sub(r'[^a-z0-9]', '', text.lower())

    def _default_languages(self) -> List[Dict[str, Any]]:
        """Static fallback list of supported Judge0 language IDs."""
        return [
            {"id": 62, "name": "Java (OpenJDK 13.0.1)", "key": "java"},
            {"id": 71, "name": "Python (3.8.1)", "key": "python"},
            {"id": 54, "name": "C++ (GCC 9.2.0)", "key": "cpp"},
            {"id": 50, "name": "C (GCC 9.2.0)", "key": "c"},
            {"id": 63, "name": "JavaScript (Node.js 12.14.0)", "key": "javascript"},
            {"id": 74, "name": "TypeScript (3.7.4)", "key": "typescript"},
            {"id": 51, "name": "C# (Mono 6.6.0.161)", "key": "csharp"},
            {"id": 60, "name": "Go (1.13.5)", "key": "go"},
            {"id": 73, "name": "Rust (1.40.0)", "key": "rust"},
            {"id": 68, "name": "PHP (7.4.1)", "key": "php"},
            {"id": 78, "name": "Kotlin (1.3.70)", "key": "kotlin"},
            {"id": 83, "name": "Swift (5.2.3)", "key": "swift"},
            {"id": 72, "name": "Ruby (2.7.0)", "key": "ruby"},
            {"id": 80, "name": "R (4.0.0)", "key": "r"},
            {"id": 82, "name": "SQL (SQLite 3.27.2)", "key": "sql"}
        ]

judge0_service = Judge0Service()

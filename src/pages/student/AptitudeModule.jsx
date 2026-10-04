import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./AptitudeModule.css";

const getScoreColorClass = (pct) => {
  const num = Number(pct);
  if (num < 40) return "red";
  if (num < 60) return "orange";
  if (num < 85) return "blue";
  return "green";
};

const formatDateText = (dateStr) => {
  if (!dateStr) return "Oct 4, 2026, 10:00 AM";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Oct 4, 2026, 10:00 AM";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return "Oct 4, 2026, 10:00 AM";
  }
};

// Helper function to normalize question options into a clean array of strings
const normalizeOptions = (rawOptions) => {
  if (Array.isArray(rawOptions)) {
    if (rawOptions.length > 0) {
      return rawOptions.map((opt) => {
        if (typeof opt === "object" && opt !== null) {
          return opt.text || opt.value || opt.option || opt.label || JSON.stringify(opt);
        }
        return String(opt);
      });
    }
  } else if (typeof rawOptions === "object" && rawOptions !== null) {
    const vals = Object.values(rawOptions).map((v) => String(v));
    if (vals.length > 0) return vals;
  } else if (typeof rawOptions === "string" && rawOptions.trim().length > 0) {
    const parts = rawOptions.split(/,|\n/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts;
  }
  return ["Option A", "Option B", "Option C", "Option D"];
};

// Helper function to guarantee robust question structure
const normalizeQuestion = (q, idx = 0) => {
  if (!q || typeof q !== "object") {
    return {
      id: idx + 1,
      question: `Question ${idx + 1}`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct_answer: 0,
      formula: "Apply standard formula & logical principles step by step.",
      explanation: "Detailed mathematical and analytical problem calculation."
    };
  }

  const questionText = q.question || q.question_text || q.title || `Question ${idx + 1}`;
  const rawOpts = q.options || q.choices || q.answers || q.option_list;
  const options = normalizeOptions(rawOpts);

  while (options.length < 4) {
    options.push(`Option ${String.fromCharCode(65 + options.length)}`);
  }

  let correctAnswer = q.correct_answer;
  if (correctAnswer === undefined || correctAnswer === null) {
    correctAnswer = q.answer || q.correctAnswer || 0;
  }
  if (typeof correctAnswer === "string") {
    const upper = correctAnswer.trim().toUpperCase();
    if (upper === "A") correctAnswer = 0;
    else if (upper === "B") correctAnswer = 1;
    else if (upper === "C") correctAnswer = 2;
    else if (upper === "D") correctAnswer = 3;
    else {
      const parsed = parseInt(correctAnswer, 10);
      correctAnswer = isNaN(parsed) ? 0 : parsed;
    }
  }

  return {
    ...q,
    id: q.id || idx + 1,
    question: questionText,
    options: options,
    correct_answer: typeof correctAnswer === "number" ? correctAnswer : 0,
    formula: q.formula || "Apply standard formula & logical principles step by step.",
    explanation: q.explanation || "Detailed mathematical and analytical problem calculation."
  };
};

// Helper function to build 25 questions per test assessment
const ensure25Questions = (baseQuestions, categoryName) => {
  let source = Array.isArray(baseQuestions) && baseQuestions.length > 0
    ? baseQuestions.map((q, i) => normalizeQuestion(q, i))
    : DEFAULT_APTITUDE_TESTS[0].questions.map((q, i) => normalizeQuestion(q, i));
  if (!source || source.length === 0) return [];
  if (source.length >= 25) return source;

  const result = [...source];
  let i = 0;
  while (result.length < 25) {
    const template = source[i % source.length];
    const qNum = result.length + 1;
    result.push(
      normalizeQuestion({
        ...template,
        question: `Q${qNum}: [${categoryName || "Aptitude"} Practice] ${template.question}`,
        formula: template.formula || "Apply standard formula & logical principles step by step.",
        explanation: template.explanation || "Detailed mathematical and analytical problem calculation."
      }, result.length)
    );
    i++;
  }
  return result;
};

const DEFAULT_APTITUDE_TESTS = [
  {
    _id: "default-quant-1",
    title: "Quantitative Aptitude Benchmark",
    description: "Speed, time-distance, ages, work-time, and numerical problem solving.",
    category: "Aptitude",
    duration_minutes: 30,
    total_marks: 50,
    created_at: "2026-10-04T10:00:00",
    questions: [
      {
        question: "A train 240 m long passes a pole in 24 seconds. How long will it take to pass a platform 650 m long?",
        options: ["65 sec", "89 sec", "100 sec", "150 sec"],
        correct_answer: 1,
        formula: "Speed = Distance / Time  |  Time = Total Distance / Speed",
        explanation: "1) Train speed = 240m / 24s = 10 m/s.\n2) Total distance to cross platform = 240m (train) + 650m (platform) = 890m.\n3) Time required = 890m / 10 m/s = 89 seconds.",
        category: "Quantitative Aptitude"
      },
      {
        question: "A father is twice as old as his son. 20 years ago, the father was 12 times as old as the son. What is the current age of the father?",
        options: ["44 years", "22 years", "48 years", "52 years"],
        correct_answer: 0,
        formula: "Let Son's Age = x, Father's Age = 2x. Equation 20 yrs ago: (2x - 20) = 12(x - 20)",
        explanation: "1) 2x - 20 = 12x - 240 => 10x = 220 => x = 22 (Son's Age).\n2) Father's current age = 2 * 22 = 44 years.",
        category: "Quantitative Aptitude"
      },
      {
        question: "A car covers a distance of 432 km at a speed of 48 km/h. How much time will it take at 72 km/h?",
        options: ["6 hours", "8 hours", "9 hours", "10 hours"],
        correct_answer: 0,
        formula: "Time = Distance / Speed",
        explanation: "1) Distance = 432 km, Speed = 72 km/h.\n2) Time = 432 / 72 = 6 hours.",
        category: "Quantitative Aptitude"
      },
      {
        question: "If 15 men complete a project in 20 days, how many days will 25 men take?",
        options: ["12 days", "15 days", "10 days", "18 days"],
        correct_answer: 0,
        formula: "Inverse Proportion: M1 * D1 = M2 * D2",
        explanation: "1) 15 * 20 = 25 * D2 => 300 = 25 * D2.\n2) D2 = 300 / 25 = 12 days.",
        category: "Quantitative Aptitude"
      },
      {
        question: "What is the Simple Interest on $5,000 invested at an annual interest rate of 8% for 3 years?",
        options: ["$1,200", "$1,000", "$900", "$1,500"],
        correct_answer: 0,
        formula: "Simple Interest (SI) = (P * R * T) / 100",
        explanation: "1) SI = (5000 * 8 * 3) / 100 = 120,000 / 100 = $1,200.",
        category: "Quantitative Aptitude"
      }
    ]
  },
  {
    _id: "default-logical-1",
    title: "Logical & Placement Reasoning",
    description: "Pattern recognition, coding-decoding, logical deduction, and series sequence analysis.",
    category: "Aptitude",
    duration_minutes: 30,
    total_marks: 50,
    created_at: "2026-10-04T11:00:00",
    questions: [
      {
        question: "If CAT is coded as 3120, how is DOG coded in the same pattern?",
        options: ["4157", "41514", "41520", "3157"],
        correct_answer: 0,
        formula: "Alphabetical Position Mapping: C=3, A=1, T=20 -> 3120",
        explanation: "1) D is 4th, O is 15th, G is 7th.\n2) Combining positions gives 4157.",
        category: "Logical Reasoning"
      },
      {
        question: "Find the odd one out: 3, 5, 11, 14, 17, 21, 29",
        options: ["14", "21", "17", "11"],
        correct_answer: 0,
        formula: "Prime Number Classification",
        explanation: "1) Numbers 3, 5, 11, 17, 29 are all prime numbers.\n2) 14 is the only even non-prime composite number in the list.",
        category: "Logical Reasoning"
      },
      {
        question: "Series: 2, 6, 12, 20, 30, ... What number comes next?",
        options: ["42", "36", "40", "48"],
        correct_answer: 0,
        formula: "Consecutive Difference Series: +4, +6, +8, +10, +12",
        explanation: "1) Differences increase by +2: +4, +6, +8, +10. Next difference is +12.\n2) 30 + 12 = 42.",
        category: "Logical Reasoning"
      },
      {
        question: "Pointing to a photograph, Rahul said, 'His mother is the only daughter of my mother.' Who is Rahul to the man?",
        options: ["Maternal Uncle", "Father", "Brother", "Grandfather"],
        correct_answer: 0,
        formula: "Blood Relation Deduction: Rahul's Mother's Only Daughter = Rahul's Sister",
        explanation: "1) The photograph man's mother is Rahul's sister.\n2) Rahul is the Maternal Uncle of the man.",
        category: "Logical Reasoning"
      },
      {
        question: "If North-East becomes South, and South-East becomes West, what does West become?",
        options: ["North-East", "South-East", "North-West", "East"],
        correct_answer: 0,
        formula: "Direction Angle Rotation: 135 degrees clockwise rotation",
        explanation: "1) Rotating directions 135 degrees clockwise turns West into North-East.",
        category: "Logical Reasoning"
      }
    ]
  },
  {
    _id: "default-verbal-1",
    title: "Verbal & Vocabulary Skills",
    description: "Grammar accuracy, sentence completion, synonyms, antonyms, and comprehension.",
    category: "Aptitude",
    duration_minutes: 30,
    total_marks: 50,
    created_at: "2026-10-04T11:30:00",
    questions: [
      {
        question: "Choose the correct synonym for 'METICULOUS':",
        options: ["Careful & Precise", "Careless", "Quick", "Aggressive"],
        correct_answer: 0,
        formula: "Etymological Synonym Mapping",
        explanation: "1) Meticulous means showing great attention to detail; very careful and precise.\n2) Correct synonym is 'Careful & Precise'.",
        category: "Verbal Ability"
      },
      {
        question: "Select the correctly punctuated sentence:",
        options: [
          "The candidate prepared diligently, therefore, he cleared the interview.",
          "The candidate prepared diligently; therefore, he cleared the interview.",
          "The candidate prepared, diligently therefore he cleared the interview.",
          "The candidate prepared diligently therefore; he cleared the interview."
        ],
        correct_answer: 1,
        formula: "Independent Clause Punctuation Rule for Conjunctive Adverbs",
        explanation: "1) A semicolon is required before conjunctive adverbs like 'therefore' when joining independent clauses.",
        category: "Verbal Ability"
      },
      {
        question: "Fill in the blank: 'Neither the manager nor the employees _____ present at the meeting.'",
        options: ["were", "was", "is", "are being"],
        correct_answer: 0,
        formula: "Subject-Verb Agreement Rule with Neither...Nor",
        explanation: "1) When subjects are connected by 'neither...nor', the verb agrees with the closer subject.\n2) 'employees' is plural, so 'were' is correct.",
        category: "Verbal Ability"
      },
      {
        question: "Choose the antonym for 'EPHEMERAL':",
        options: ["Permanent", "Transient", "Short-lived", "Fleeting"],
        correct_answer: 0,
        formula: "Antonym Semantics",
        explanation: "1) Ephemeral means lasting a very short time.\n2) Its direct opposite is 'Permanent'.",
        category: "Verbal Ability"
      },
      {
        question: "Select the correctly spelled word from the options below:",
        options: ["Accommodation", "Acommodation", "Accomodation", "Acommodatun"],
        correct_answer: 0,
        formula: "Spelling Rule: Double 'c' and Double 'm'",
        explanation: "1) Accommodation is spelled with double 'c' (cc) and double 'm' (mm).",
        category: "Verbal Ability"
      }
    ]
  },
  {
    _id: "default-di-1",
    title: "Data Interpretation & Speed Math",
    description: "Data tables, chart analysis, ratios, averages, and rapid calculation techniques.",
    category: "Aptitude",
    duration_minutes: 30,
    total_marks: 50,
    created_at: "2026-10-04T12:00:00",
    questions: [
      {
        question: "If a company's profit increases from $50,000 to $65,000, what is the percentage increase?",
        options: ["30%", "25%", "15%", "35%"],
        correct_answer: 0,
        formula: "Percentage Increase = ((New Value - Old Value) / Old Value) * 100",
        explanation: "1) Profit increase = 65,000 - 50,000 = 15,000.\n2) Percentage = (15,000 / 50,000) * 100 = 30%.",
        category: "Data Interpretation"
      },
      {
        question: "The average score of 5 students is 80. What is the total sum of all scores?",
        options: ["400", "480", "500", "360"],
        correct_answer: 0,
        formula: "Sum of Observations = Average * Total Count",
        explanation: "1) Average = 80, Count = 5.\n2) Total Sum = 80 * 5 = 400.",
        category: "Data Interpretation"
      },
      {
        question: "Ratio of A to B is 3:4 and B to C is 8:9. What is the ratio of A to C?",
        options: ["3:3", "3:4", "2:3", "1:2"],
        correct_answer: 2,
        formula: "Compound Ratio Scaling: A/B * B/C = A/C",
        explanation: "1) A:B = 3:4 = 6:8.\n2) B:C = 8:9.\n3) A:C = 6:9 = 2:3.",
        category: "Data Interpretation"
      },
      {
        question: "Simplify: 15% of 400 + 25% of 240:",
        options: ["120", "110", "100", "130"],
        correct_answer: 0,
        formula: "(P1/100 * N1) + (P2/100 * N2)",
        explanation: "1) 15% of 400 = 60.\n2) 25% of 240 = 60.\n3) Total = 60 + 60 = 120.",
        category: "Data Interpretation"
      },
      {
        question: "In a pie chart, a sector representing sales has a central angle of 72 degrees. What percentage of total sales does it represent?",
        options: ["20%", "25%", "15%", "30%"],
        correct_answer: 0,
        formula: "Pie Chart % = (Sector Angle / 360) * 100",
        explanation: "1) Percentage = (72 / 360) * 100 = (1 / 5) * 100 = 20%.",
        category: "Data Interpretation"
      }
    ]
  },
  {
    _id: "default-tech-apt-1",
    title: "Technical & Pseudocode Aptitude",
    description: "Loop tracing, recursion depth, bitwise operations, and memory logic.",
    category: "Aptitude",
    duration_minutes: 30,
    total_marks: 50,
    created_at: "2026-10-04T12:30:00",
    questions: [
      {
        question: "What is the output of `int x = 5; System.out.println(x++ + ++x);`?",
        options: ["12", "11", "10", "13"],
        correct_answer: 0,
        formula: "Post-increment (x++) uses current value (5), Pre-increment (++x) increments before returning (7).",
        explanation: "1) x++ evaluates to 5, and x becomes 6.\n2) ++x increments x to 7 and evaluates to 7.\n3) 5 + 7 = 12.",
        category: "Technical Aptitude"
      },
      {
        question: "If an array has 8 elements, how many comparisons are needed in Binary Search in worst case?",
        options: ["4", "3", "8", "7"],
        correct_answer: 0,
        formula: "Worst-case Binary Search Comparisons = floor(log2(N)) + 1",
        explanation: "1) log2(8) = 3.\n2) Worst-case comparisons = 3 + 1 = 4.",
        category: "Technical Aptitude"
      },
      {
        question: "What is the bitwise XOR result of `12 ^ 5`?",
        options: ["9", "7", "15", "8"],
        correct_answer: 0,
        formula: "Bitwise XOR (A ^ B) returns 1 when bits differ, 0 when identical.",
        explanation: "1) 12 in binary = 1100.\n2) 5 in binary = 0101.\n3) 1100 ^ 0101 = 1001 in binary = 9.",
        category: "Technical Aptitude"
      },
      {
        question: "In a LIFO stack with operations push(3), push(5), pop(), push(7), what element is at the top?",
        options: ["7", "5", "3", "Empty"],
        correct_answer: 0,
        formula: "LIFO (Last In First Out) Stack State",
        explanation: "1) push(3) -> [3]\n2) push(5) -> [3, 5]\n3) pop() -> removes 5, leaves [3]\n4) push(7) -> [3, 7]. Top element is 7.",
        category: "Technical Aptitude"
      },
      {
        question: "Which data structure follows the First In First Out (FIFO) principle for inserting and removing elements?",
        options: ["Queue", "Stack", "Binary Tree", "Graph"],
        correct_answer: 0,
        formula: "FIFO Queue Data Structure Rule",
        explanation: "1) A Queue processes elements in the order they arrive (FIFO).",
        category: "Technical Aptitude"
      }
    ]
  },
  {
    _id: "default-spatial-1",
    title: "Spatial & Diagrammatic Reasoning",
    description: "3D cube rotation, edge coloring patterns, visual sequence, and geometric angles.",
    category: "Aptitude",
    duration_minutes: 30,
    total_marks: 50,
    created_at: "2026-10-04T13:00:00",
    questions: [
      {
        question: "A cube of side 4 cm is painted red on all sides and cut into 1 cm small cubes. How many small cubes have NO sides painted?",
        options: ["8", "16", "24", "4"],
        correct_answer: 0,
        formula: "Unpainted Cubes Formula = (n - 2)^3 where n = side length",
        explanation: "1) n = 4 cm / 1 cm = 4.\n2) Unpainted cubes = (4 - 2)^3 = 2^3 = 8.",
        category: "Spatial Reasoning"
      },
      {
        question: "In the same 4 cm cube cut into 1 cm small cubes, how many small cubes have EXACTLY 2 sides painted?",
        options: ["24", "12", "8", "16"],
        correct_answer: 0,
        formula: "2-Sides Painted Cubes Formula = 12 * (n - 2)",
        explanation: "1) n = 4.\n2) 2-sides painted edge cubes = 12 * (4 - 2) = 12 * 2 = 24.",
        category: "Spatial Reasoning"
      },
      {
        question: "How many small cubes have EXACTLY 3 sides painted in any painted large cube?",
        options: ["8", "4", "12", "16"],
        correct_answer: 0,
        formula: "3-Sides Painted Corner Cubes = Always 8",
        explanation: "1) Only the 8 corner cubes of a large cube have 3 sides exposed to paint.\n2) The answer is always 8 regardless of size.",
        category: "Spatial Reasoning"
      },
      {
        question: "A wall clock displays 3:30. What is the acute angle between the hour and minute hands?",
        options: ["75 degrees", "80 degrees", "90 degrees", "60 degrees"],
        correct_answer: 0,
        formula: "Clock Angle Formula = |30*H - (11/2)*M|",
        explanation: "1) H = 3, M = 30.\n2) Angle = |30(3) - (11/2)(30)| = |90 - 165| = |-75| = 75 degrees.",
        category: "Spatial Reasoning"
      },
      {
        question: "A square paper sheet is folded in half twice and a single hole is punched through the center. How many holes appear when unfolded?",
        options: ["4 holes", "2 holes", "8 holes", "1 hole"],
        correct_answer: 0,
        formula: "Paper Folding Layer Symmetry: 2 folds = 4 layers",
        explanation: "1) Folding twice creates 4 overlapping layers.\n2) Punching 1 hole through 4 layers produces 4 holes upon unfolding.",
        category: "Spatial Reasoning"
      }
    ]
  },
  {
    _id: "default-probability-1",
    title: "Probability & Combinatorics",
    description: "Permutations, combinations, card draws, dice totals, and sample spaces.",
    category: "Aptitude",
    duration_minutes: 30,
    total_marks: 50,
    created_at: "2026-10-04T13:15:00",
    questions: [
      {
        question: "Two unbiased dice are rolled together. What is the probability that the sum of scores is 7?",
        options: ["1/6", "1/12", "5/36", "1/4"],
        correct_answer: 0,
        formula: "Probability = Favorable Outcomes / Total Sample Space (36)",
        explanation: "1) Pairs giving sum 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 outcomes.\n2) Total outcomes = 6 * 6 = 36.\n3) Probability = 6 / 36 = 1/6.",
        category: "Probability & Statistics"
      },
      {
        question: "In how many ways can 5 candidates be seated in a row of 5 chairs?",
        options: ["120", "24", "60", "720"],
        correct_answer: 0,
        formula: "Permutations of n items in n positions = n!",
        explanation: "1) n = 5.\n2) Total arrangements = 5! = 5 * 4 * 3 * 2 * 1 = 120 ways.",
        category: "Probability & Statistics"
      },
      {
        question: "A bag contains 4 red and 6 black balls. 2 balls are drawn at random. What is the probability both are red?",
        options: ["2/15", "4/25", "1/5", "2/9"],
        correct_answer: 0,
        formula: "Probability = Combination C(Red, 2) / Combination C(Total, 2)",
        explanation: "1) C(4,2) = 6.\n2) C(10,2) = 45.\n3) Probability = 6 / 45 = 2/15.",
        category: "Probability & Statistics"
      },
      {
        question: "From a standard deck of 52 cards, 1 card is drawn. What is the probability that it is a King OR a Heart?",
        options: ["4/13", "16/52", "1/4", "3/13"],
        correct_answer: 0,
        formula: "P(A U B) = P(A) + P(B) - P(A ∩ B)",
        explanation: "1) P(King) = 4/52, P(Heart) = 13/52, P(King of Hearts) = 1/52.\n2) P(King or Heart) = 4/52 + 13/52 - 1/52 = 16/52 = 4/13.",
        category: "Probability & Statistics"
      },
      {
        question: "A fair coin is tossed 3 times. What is the probability of obtaining AT LEAST 2 heads?",
        options: ["1/2", "3/8", "5/8", "1/4"],
        correct_answer: 0,
        formula: "Probability = Favorable Outcomes (HHH, HHT, HTH, THH = 4) / Total (8)",
        explanation: "1) Total 3-coin outcomes = 2^3 = 8.\n2) Outcomes with 2 or 3 heads = 4.\n3) Probability = 4 / 8 = 1/2.",
        category: "Probability & Statistics"
      }
    ]
  },
  {
    _id: "default-financial-1",
    title: "Commercial Math & Business Aptitude",
    description: "Simple and compound interest, profit & loss, discounts, and ratio mixtures.",
    category: "Aptitude",
    duration_minutes: 30,
    total_marks: 50,
    created_at: "2026-10-04T13:30:00",
    questions: [
      {
        question: "A merchant marks an item 20% above cost price and offers a 10% discount. What is his net profit percentage?",
        options: ["8%", "10%", "12%", "6%"],
        correct_answer: 0,
        formula: "Net % Change = A + B + (A*B)/100 where A=+20, B=-10",
        explanation: "1) Net Change = 20 - 10 + (20 * -10)/100 = 10 - 2 = 8% profit.",
        category: "Commercial Aptitude"
      },
      {
        question: "What is the Compound Interest on $10,000 for 2 years at 10% per annum compounded annually?",
        options: ["$2,100", "$2,000", "$2,200", "$1,900"],
        correct_answer: 0,
        formula: "Amount = Principal * (1 + Rate/100)^Time  |  CI = Amount - Principal",
        explanation: "1) Amount = 10,000 * (1.10)^2 = 10,000 * 1.21 = 12,100.\n2) CI = 12,100 - 10,000 = $2,100.",
        category: "Commercial Aptitude"
      },
      {
        question: "If Cost Price of 15 articles equals Selling Price of 12 articles, what is the profit percentage?",
        options: ["25%", "20%", "30%", "15%"],
        correct_answer: 0,
        formula: "Profit % = ((CP Count - SP Count) / SP Count) * 100",
        explanation: "1) Profit % = ((15 - 12) / 12) * 100 = (3 / 12) * 100 = 25%.",
        category: "Commercial Aptitude"
      },
      {
        question: "A sum of money doubles itself in 8 years at Simple Interest. What is the annual interest rate?",
        options: ["12.5%", "10%", "15%", "8%"],
        correct_answer: 0,
        formula: "Simple Interest Rate = 100 / Years (when money doubles)",
        explanation: "1) Rate = 100 / 8 = 12.5% per annum.",
        category: "Commercial Aptitude"
      },
      {
        question: "A merchant sells an article for $480 incurring a 20% loss. What was the original Cost Price of the article?",
        options: ["$600", "$560", "$520", "$640"],
        correct_answer: 0,
        formula: "Cost Price (CP) = Selling Price / (1 - Loss Percentage/100)",
        explanation: "1) CP = 480 / (1 - 0.20) = 480 / 0.80 = $600.",
        category: "Commercial Aptitude"
      }
    ]
  }
];

function AptitudeModule() {
  const location = useLocation();
  const navigate = useNavigate();

  const [availableTests, setAvailableTests] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);

  // Active test state
  const [activeTest, setActiveTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [malpracticeCount, setMalpracticeCount] = useState(0);
  const [showMalpracticeModal, setShowMalpracticeModal] = useState(false);

  // Pagination for 5x5 Grid Question Palette (25 questions per page)
  const [palettePage, setPalettePage] = useState(0);

  // Camera verification popup & Granted State logic
  const [showCamModal, setShowCamModal] = useState(false);
  const [pendingTest, setPendingTest] = useState(null);
  const [camModalActive, setCamModalActive] = useState(false);
  const [camStatus, setCamStatus] = useState("prompt"); // "prompt" | "requesting" | "granted" | "denied" | "unavailable" | "error"
  const [camErrorMsg, setCamErrorMsg] = useState("");
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const modalVideoRef = useRef(null);
  const videoRef = useRef(null);

  // Live mid-screen camera preview modal state
  const [showLiveCamModal, setShowLiveCamModal] = useState(false);
  const liveCamVideoRef = useRef(null);

  // Request browser camera stream cleanly using navigator.mediaDevices.getUserMedia
  const requestCameraPermission = async () => {
    setCamStatus("requesting");
    setCamErrorMsg("");

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCamStatus("unavailable");
      setCamErrorMsg("Camera access is not supported by your browser.");
      setCamModalActive(false);
      setCameraAllowed(false);
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCamStatus("granted");
      setCamErrorMsg("");
      setCamModalActive(true);
      setCameraAllowed(true);

      if (modalVideoRef.current) {
        modalVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.warn("Camera permission error:", err);
      let msg = "Failed to access webcam feed.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCamStatus("denied");
        msg = "Camera permission was blocked by your browser. Please allow camera access in your browser site settings and try again.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCamStatus("unavailable");
        msg = "No camera device found on your system. Please connect a webcam.";
      } else {
        setCamStatus("error");
        msg = err.message || "An error occurred while initializing webcam hardware.";
      }
      setCamErrorMsg(msg);
      setCamModalActive(false);
      setCameraAllowed(false);
      return null;
    }
  };

  // Stream handler for mid-screen live camera modal
  useEffect(() => {
    let stream = null;
    if (showLiveCamModal && liveCamVideoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((s) => {
          stream = s;
          if (liveCamVideoRef.current) {
            liveCamVideoRef.current.srcObject = s;
          }
        })
        .catch((err) => console.log("Live camera stream error:", err));
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showLiveCamModal]);

  // Auto-sync palette pagination with current question index
  useEffect(() => {
    setPalettePage(Math.floor(currentIdx / 25));
  }, [currentIdx]);

  // Load tests and attempts
  const fetchTestsAndAttempts = async () => {
    setLoadingTests(true);
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        api.get("/assessments?category=Aptitude").catch(() => ({ data: { data: [] } })),
        api.get("/assessments/attempts/my").catch(() => ({ data: { data: [] } }))
      ]);

      let tests = testsRes.data?.data || [];
      let attempts = attemptsRes.data?.data || [];

      // Local storage attempts
      const localAttempts = JSON.parse(localStorage.getItem("kvgce_aptitude_attempts") || "[]");
      localAttempts.forEach((la) => {
        if (!attempts.some((a) => a.assessment_id === la.assessment_id)) {
          attempts.push(la);
        }
      });

      // Default fallback tests
      const existingIds = new Set(tests.map(t => t._id));
      DEFAULT_APTITUDE_TESTS.forEach(dt => {
        if (!existingIds.has(dt._id)) {
          tests.push(dt);
        }
      });

      setAvailableTests(tests);
      setMyAttempts(attempts);
    } catch (err) {
      console.error("Error fetching aptitude tests:", err);
      setAvailableTests(DEFAULT_APTITUDE_TESTS);
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    fetchTestsAndAttempts();
  }, []);

  // Reset all test attempts to allow retaking tests fresh
  const handleResetAllAttempts = () => {
    if (window.confirm("🔄 Are you sure you want to reset all assessment attempts and start fresh?")) {
      localStorage.removeItem("kvgce_aptitude_attempts");
      setMyAttempts([]);
      alert("All test attempts reset! You can now start fresh.");
    }
  };

  // Handle URL params
  useEffect(() => {
    if (availableTests.length > 0 && !activeTest) {
      const searchParams = new URLSearchParams(location.search);
      const targetTestId = searchParams.get("testId");
      const shouldViewResult = searchParams.get("viewResult") === "true";

      if (targetTestId) {
        const found = availableTests.find((t) => t._id === targetTestId);
        if (found) {
          if (shouldViewResult) {
            handleViewResultSheet(found);
          } else {
            handleStartTestClick(found);
          }
        }
      }
    }
  }, [availableTests, location.search]);

  // Camera setup modal effect
  useEffect(() => {
    let activeStream = null;
    if (showCamModal) {
      requestCameraPermission().then((st) => {
        activeStream = st;
      });
    }
    return () => {
      if (activeStream && activeStream.getTracks) {
        try {
          activeStream.getTracks().forEach((track) => track.stop());
        } catch (e) {
          console.warn("Error stopping modal camera track:", e);
        }
      }
    };
  }, [showCamModal]);

  // Active Webcam Proctoring Feed during test
  useEffect(() => {
    let activeStream = null;
    if (activeTest && !isSubmitted) {
      if (navigator?.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          .then((stream) => {
            activeStream = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setCameraActive(true);
            }
          })
          .catch((err) => {
            console.warn("Proctoring camera access denied:", err);
            setCameraActive(false);
          });
      }

      return () => {
        if (activeStream && activeStream.getTracks) {
          try {
            activeStream.getTracks().forEach((track) => track.stop());
          } catch (e) {
            console.warn("Error stopping proctoring camera track:", e);
          }
        }
      };
    }
  }, [activeTest, isSubmitted]);

  // Malpractice Detection: Visibility Change, Window Blur, Navigation
  useEffect(() => {
    if (!activeTest || isSubmitted) return;

    const triggerMalpracticeWarning = () => {
      setMalpracticeCount((prev) => {
        const nextCount = prev + 1;
        if (nextCount >= 3) {
          alert("🚨 MALPRACTICE VIOLATION: 3 strikes exceeded! Your test is automatically submitted immediately.");
          handleSubmitTest();
        } else {
          setShowMalpracticeModal(true);
        }
        return nextCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerMalpracticeWarning();
      }
    };

    const handleWindowBlur = () => {
      triggerMalpracticeWarning();
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Warning: Navigating away during a proctored assessment is counted as a malpractice violation!";
      return e.returnValue;
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeTest, isSubmitted]);

  // Countdown timer effect
  useEffect(() => {
    if (!activeTest || isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTest, isSubmitted, timeLeft]);

  // Open Camera Popup when clicking Start Test
  const handleStartTestClick = (test) => {
    const prevAttempt = getAttemptForTest(test._id);
    if (prevAttempt) {
      handleViewResultSheet(test);
      return;
    }
    setPendingTest(test);
    setShowCamModal(true);
  };

  // Confirm camera & launch test logic (Camera Authorized)
  const handleConfirmStartTest = (optTest) => {
    let test = (optTest && optTest.title) ? optTest : (pendingTest || availableTests[0] || DEFAULT_APTITUDE_TESTS[0]);
    if (!test) return;

    try {
      const testQs = ensure25Questions(test.questions || [], test.title);
      setQuestions(testQs);
      setCurrentIdx(0);
      setAnswers({});
      setTimeLeft((test.duration_minutes || 30) * 60);
      setIsSubmitted(false);
      setResult(null);
      setMalpracticeCount(0);
      setPalettePage(0);
      setCameraAllowed(true);
      setShowCamModal(false);
      setPendingTest(null);
      setActiveTest(test);
    } catch (err) {
      console.error("Error launching test:", err);
      const fallbackTest = DEFAULT_APTITUDE_TESTS[0];
      const safeQs = ensure25Questions(fallbackTest.questions, fallbackTest.title);
      setQuestions(safeQs);
      setCurrentIdx(0);
      setAnswers({});
      setTimeLeft(1800);
      setIsSubmitted(false);
      setResult(null);
      setShowCamModal(false);
      setPendingTest(null);
      setActiveTest(fallbackTest);
    }
  };

  // View Result / Answer Sheet anytime
  const handleViewResultSheet = (test) => {
    const prevAttempt = getAttemptForTest(test._id);
    setActiveTest(test);
    const testQs = ensure25Questions(test.questions || [], test.title);
    setQuestions(testQs);
    setIsSubmitted(true);

    if (prevAttempt) {
      setResult({
        assessment_title: test.title,
        total_questions: testQs.length,
        correct_answers: prevAttempt.correct_answers || Math.round((prevAttempt.score / (prevAttempt.total_marks || 50)) * testQs.length),
        score: prevAttempt.score,
        total_marks: prevAttempt.total_marks || 50,
        percentage: prevAttempt.percentage,
        time_taken_seconds: prevAttempt.time_taken_seconds || 120,
        evaluated_questions: prevAttempt.evaluated_questions || testQs.map((q, i) => ({
          ...q,
          user_choice: prevAttempt.answers ? prevAttempt.answers[i] : q.correct_answer,
          is_correct: prevAttempt.answers ? prevAttempt.answers[i] === q.correct_answer : true
        }))
      });
    }
  };

  // Select Option
  const handleSelectOption = (qIdx, optionIdx) => {
    setAnswers({ ...answers, [qIdx]: optionIdx });
  };

  // Submit test (Records camera_verified & malpractice_strikes to backend & local storage)
  const handleSubmitTest = async () => {
    if (submitting || !activeTest) return;
    setSubmitting(true);
    const durationTotal = (activeTest.duration_minutes || 30) * 60;
    const timeTaken = durationTotal - timeLeft;

    let correct = 0;
    let evaluatedQs = [];
    questions.forEach((q, idx) => {
      const userChoice = answers[idx];
      const isCorrect = userChoice === q.correct_answer;
      if (isCorrect) correct++;
      evaluatedQs.push({
        ...q,
        user_choice: userChoice,
        is_correct: isCorrect
      });
    });

    const totalMarks = activeTest.total_marks || (questions.length * 2);
    const score = correct * 2;
    const pct = Math.round((correct / (questions.length || 1)) * 100);

    const resultPayload = {
      assessment_title: activeTest.title,
      total_questions: questions.length,
      correct_answers: correct,
      wrong_answers: Object.keys(answers).length - correct,
      unanswered: questions.length - Object.keys(answers).length,
      score: score,
      total_marks: totalMarks,
      percentage: pct,
      time_taken_seconds: timeTaken,
      evaluated_questions: evaluatedQs,
      answers: answers,
      camera_verified: cameraAllowed,
      malpractice_strikes: malpracticeCount
    };

    setResult(resultPayload);
    setIsSubmitted(true);
    setSubmitting(false);

    // Save attempt record locally
    const newAttemptRecord = {
      assessment_id: activeTest._id,
      assessment_title: activeTest.title,
      score: score,
      total_marks: totalMarks,
      percentage: pct,
      submitted_at: new Date().toISOString(),
      correct_answers: correct,
      time_taken_seconds: timeTaken,
      evaluated_questions: evaluatedQs,
      answers: answers,
      camera_verified: cameraAllowed,
      malpractice_strikes: malpracticeCount
    };

    const existingLocal = JSON.parse(localStorage.getItem("kvgce_aptitude_attempts") || "[]");
    const updatedLocal = [...existingLocal.filter(a => a.assessment_id !== activeTest._id), newAttemptRecord];
    localStorage.setItem("kvgce_aptitude_attempts", JSON.stringify(updatedLocal));

    setMyAttempts(prev => [...prev.filter(a => a.assessment_id !== activeTest._id), newAttemptRecord]);

    try {
      await api.post(`/assessments/${activeTest._id}/attempt`, {
        answers: answers,
        time_taken_seconds: timeTaken,
        camera_verified: cameraAllowed,
        malpractice_strikes: malpracticeCount
      });
    } catch (e) {
      console.warn("Backend attempt sync warning:", e);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getAttemptForTest = (testId) => {
    const matches = myAttempts.filter((a) => a.assessment_id === testId);
    if (matches.length === 0) return null;
    return matches.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0];
  };

  // 5x5 Grid pagination parameters
  const pageStart = palettePage * 25;
  const pageEnd = pageStart + 25;
  const visibleQuestions = questions.slice(pageStart, pageEnd);

  // Render Test Selection Grid (4 in 1 row)
  if (!activeTest) {
    return (
      <DashboardLayout title="Aptitude Assessments">
        <div className="aptitude-container">
          {/* CAMERA POPUP BEFORE STARTING TEST */}
          {showCamModal && (
            <div className="cam-setup-overlay">
              <div className="cam-setup-modal">
                <div className="cam-setup-header">
                  <h3>📷 Camera & Proctoring Verification</h3>
                </div>
                <p className="cam-setup-subtitle">
                  Please verify your camera position. Live proctoring will be active during <strong>{pendingTest?.title}</strong>.
                </p>

                {camErrorMsg ? (
                  <div className="cam-error-box">
                    <strong>⚠️ Camera Access Notice:</strong>
                    {camErrorMsg}
                  </div>
                ) : (
                  <div className="cam-setup-preview-box">
                    <video ref={modalVideoRef} autoPlay playsInline muted className="cam-modal-video" />
                    <div className="cam-modal-badge">
                      <span className={`cam-dot ${camStatus === "granted" ? "active" : camStatus === "denied" ? "denied" : ""}`}></span>
                      {camStatus === "granted" ? "Camera On & Positioned" : camStatus === "requesting" ? "Connecting Camera..." : "Camera Verification"}
                    </div>
                  </div>
                )}

                <div className="cam-setup-actions">
                  <button className="btn-modal-cancel" onClick={() => setShowCamModal(false)}>
                    Cancel
                  </button>

                  {camStatus === "denied" || camStatus === "unavailable" || camStatus === "error" ? (
                    <>
                      <button className="btn-modal-retry" onClick={requestCameraPermission}>
                        🎥 Retry Camera Access
                      </button>
                      <button className="btn-modal-proceed" onClick={() => handleConfirmStartTest(pendingTest)}>
                        🚀 Start Test
                      </button>
                    </>
                  ) : (
                    <button className="btn-modal-confirm" onClick={() => handleConfirmStartTest(pendingTest)}>
                      Allow & Start Test
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="aptitude-header-banner">
            <div>
              <h2>Aptitude Assessments</h2>
              <p>Proctored talent and placement evaluations. Live face camera active during tests.</p>
            </div>
            <button className="btn-reset-all" onClick={handleResetAllAttempts} title="Reset all test history to retake tests">
              🔄 Reset Attempts & Start Fresh
            </button>
          </div>

          {loadingTests ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading aptitude tests...</div>
          ) : (
            <div className="tests-grid-4col">
              {availableTests.map((test) => {
                const prevAttempt = getAttemptForTest(test._id);
                const isCompleted = Boolean(prevAttempt);
                const qCount = 25; // 25 questions total per test assessment
                const duration = test.duration_minutes || 30;

                return (
                  <div key={test._id} className="test-card-simple">
                    <div className="test-card-header">
                      <h3 className="test-card-title">{test.title}</h3>
                      <p className="test-card-desc">{test.description || "Aptitude & problem solving skills evaluation."}</p>
                    </div>

                    <div className="test-card-meta-simple">
                      <div className="meta-text-item">Timing: {duration} Minutes</div>
                      <div className="meta-text-item">Total Questions: {qCount} Questions</div>
                      <div className="meta-text-item">Date & Time: {formatDateText(test.created_at)}</div>
                    </div>

                    <div className="test-card-action-wrap">
                      {isCompleted ? (
                        <button
                          className="btn-test-action btn-view-sheet"
                          onClick={() => handleViewResultSheet(test)}
                        >
                          View Result
                        </button>
                      ) : (
                        <button
                          className="btn-test-action btn-start"
                          onClick={() => handleStartTestClick(test)}
                        >
                          Start Test
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Active Test or Result Sheet View
  const safeQuestions = Array.isArray(questions) && questions.length > 0 
    ? questions.map((q, i) => normalizeQuestion(q, i))
    : ensure25Questions(activeTest?.questions || [], activeTest?.title || "Aptitude");

  const safeIdx = Math.min(Math.max(0, currentIdx), safeQuestions.length - 1);
  const currentQ = normalizeQuestion(safeQuestions[safeIdx], safeIdx);

  const scoreColor = getScoreColorClass(result?.percentage || 0);

  return (
    <DashboardLayout title={`Aptitude Test: ${activeTest?.title || "Assessment"}`}>
      <div className="aptitude-container">
        {/* HIDDEN BACKGROUND WEBCAM STREAM FOR PROCTORING */}
        <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />

        {/* MALPRACTICE WARNING MODAL OVERLAY */}
        {showMalpracticeModal && (
          <div className="malpractice-overlay">
            <div className="malpractice-modal">
              <div className="malpractice-header">
                ⚠️ MALPRACTICE STRIKE WARNING ({malpracticeCount} / 3)
              </div>
              <p className="malpractice-text">
                Switching tabs, minimizing the browser, or leaving the active test area is strictly prohibited.
              </p>
              <p className="malpractice-warning-note">
                You have <strong>{3 - malpracticeCount}</strong> warning strike(s) remaining. On your 3rd strike, the test will be automatically submitted immediately!
              </p>
              <button
                className="malpractice-acknowledge-btn"
                onClick={() => setShowMalpracticeModal(false)}
              >
                I Understand & Continue Test
              </button>
            </div>
          </div>
        )}

        {/* SMALL FLOATING LIVE CAMERA PREVIEW DIV AT BOTTOM RIGHT */}
        {showLiveCamModal && (
          <div className="small-floating-cam-box">
            <div className="floating-cam-header">
              <span>📷 Live Proctoring Cam</span>
              <button
                type="button"
                className="floating-cam-close-btn"
                onClick={() => setShowLiveCamModal(false)}
                title="Close camera preview"
              >
                ✕
              </button>
            </div>
            <div className="floating-cam-video-wrap">
              <video
                ref={liveCamVideoRef}
                autoPlay
                playsInline
                muted
                className="floating-cam-video"
              />
              <div className="floating-cam-badge">
                <span className="live-dot green-dot"></span> LIVE PROCTOR
              </div>
            </div>
          </div>
        )}

        <button
          className="btn-back-link"
          onClick={() => {
            if (!isSubmitted) {
              if (window.confirm("⚠️ Leaving will count as a malpractice warning! Are you sure?")) {
                setActiveTest(null);
              }
            } else {
              setActiveTest(null);
            }
          }}
        >
          ← Back to Assessments List
        </button>

        {!isSubmitted ? (
          <div className="active-test-container">
            {/* FULL ROW TOP TITLE BAR */}
            <div className="test-top-bar full-width-bar">
              <div className="test-top-left">
                <h2 className="active-test-heading">{activeTest?.title || "Proctored Aptitude Assessment"}</h2>
                <span className="q-count-sub text-muted">Proctored Assessment Mode</span>
              </div>

              <div className="top-bar-right-group">
                {/* ALL-RED MALPRACTICE STRIKES TEXT */}
                <div className="malpractice-inline-right all-red-strike">
                  <span className="strike-icon">🚨</span>
                  <span>Malpractice Strikes: </span>
                  <strong className="strike-red-count">{malpracticeCount}/3</strong>
                </div>

                {/* GREEN CAMERA ON BADGE (CLICKABLE TO VIEW MID-SCREEN POPUP) */}
                <div
                  className="cam-on-badge green-cam-badge clickable-cam-badge"
                  onClick={() => setShowLiveCamModal(true)}
                  title="Click to view live camera feed in mid-screen"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span>Camera On 🔍</span>
                </div>
              </div>
            </div>

            {/* 2-COLUMN GRID ALIGNED AT SAME TOP ROW LEVEL & EQUAL HEIGHT */}
            <div className="test-interface-grid equal-height-grid">
              {/* LEFT AREA: CLEAN QUESTION CARD MATCHING SCREENSHOT */}
              <div className="left-test-area flex-fill">
                <div className="question-card clean-question-card">
                  {/* SEGMENTED PROGRESS BAR & STEP COUNTER */}
                  <div className="q-progress-segmented-header">
                    <div className="segmented-bar">
                      {questions.map((_, idx) => (
                        <div
                          key={idx}
                          className={`segment-bar-item ${idx <= currentIdx ? "active" : ""}`}
                        />
                      ))}
                    </div>
                    <div className="segment-step-count">
                      {currentIdx + 1} / {questions.length}
                    </div>
                  </div>

                  {/* BOLD QUESTION TEXT */}
                  <h3 className="q-text screenshot-bold-q">
                    {currentQ.question}
                  </h3>

                  {/* OPTION BLOCKS (A., B., C., D.) */}
                  <div className="screenshot-options-list">
                    {(currentQ.options || []).map((opt, optIdx) => {
                      const isSelected = answers[currentIdx] === optIdx;
                      const letter = String.fromCharCode(65 + optIdx);
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          className={`screenshot-option-block ${isSelected ? "selected" : ""}`}
                          onClick={() => handleSelectOption(currentIdx, optIdx)}
                        >
                          <span className="opt-letter-prefix">{letter}.</span>
                          <span className="opt-text-val">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* BOTTOM ACTION BAR WITH ARROW MARKS (← PREVIOUS & NEXT →) */}
                  <div className="screenshot-card-footer">
                    <button
                      onClick={() => setCurrentIdx(currentIdx - 1)}
                      className="screenshot-pill-btn prev-gray-pill"
                      disabled={currentIdx === 0}
                    >
                      ← Previous
                    </button>

                    <div className="footer-right-nav">
                      {currentIdx < questions.length - 1 ? (
                        <button
                          onClick={() => setCurrentIdx(currentIdx + 1)}
                          className="screenshot-pill-btn next-blue-pill"
                        >
                          Next →
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitTest}
                          className="screenshot-pill-btn submit-green-pill"
                          disabled={submitting}
                        >
                          {submitting ? "Submitting..." : "Submit Test ✓"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT TEST AREA: 50% BLACK TIMER & 50% CLICKABLE CAMERA CARD */}
              <div className="right-test-area flex-fill">
                {/* 50% BLACK TIMER & 50% LIVE CAMERA STATUS CARD WITH DIVIDER BORDER */}
                <div className="split-timer-cam-card">
                  {/* LEFT 50%: BLACK TIMER */}
                  <div className="timer-split-50 black-bg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <div className="timer-split-text">
                      <span className="split-lbl">Time Left</span>
                      <span className="split-val">{formatTime(timeLeft)}</span>
                    </div>
                  </div>

                  {/* BORDER DIVIDER LINE BETWEEN TIMER AND CAMERA */}
                  <div className="timer-split-divider"></div>

                  {/* RIGHT 50%: CLICKABLE CAMERA STATUS */}
                  <div
                    className="timer-split-50 cam-bg clickable-split-cam"
                    onClick={() => setShowLiveCamModal(true)}
                    title="Click to view mid-screen live camera feed"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <div className="timer-split-text">
                      <span className="split-lbl-cam">Proctoring</span>
                      <span className="split-val-cam">Camera On 🔍</span>
                    </div>
                  </div>
                </div>

                {/* QUESTION NAVIGATION PALETTE (5x5 GRID WITH CLEAN TEXT NAVIGATION AT BOTTOM) */}
                <div className="palette-card compact-palette flex-fill-card">
                  <h4 className="palette-title">Question Palette</h4>

                  {/* 5x5 GRID */}
                  <div className="palette-grid grid-5x5">
                    {visibleQuestions.map((_, pIdx) => {
                      const globalIdx = pageStart + pIdx;
                      const isAnswered = answers[globalIdx] !== undefined;
                      const isCurrent = globalIdx === currentIdx;
                      return (
                        <button
                          key={globalIdx}
                          className={`palette-num tight-num ${isCurrent ? "current" : ""} ${isAnswered ? "answered" : ""}`}
                          onClick={() => setCurrentIdx(globalIdx)}
                        >
                          {globalIdx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="palette-legend tight-legend">
                    <span><span className="legend-box answered"></span> Answered</span>
                    <span><span className="legend-box"></span> Unanswered</span>
                  </div>

                  {/* CLEAN TEXT NAVIGATION ON RIGHT SIDE WITH ARROW MARK (NO HEAVY BOX) */}
                  <div className="palette-clean-text-nav">
                    {palettePage > 0 && (
                      <button
                        type="button"
                        className="btn-page-text-link"
                        onClick={() => setPalettePage((prev) => prev - 1)}
                      >
                        ← 1-25
                      </button>
                    )}

                    {pageEnd < questions.length && (
                      <button
                        type="button"
                        className="btn-page-text-link link-right-align"
                        onClick={() => setPalettePage((prev) => prev + 1)}
                      >
                        Questions {pageEnd + 1}-{Math.min(pageEnd + 25, questions.length)} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* RESULT SHEET & DETAILED ANSWER KEY BREAKDOWN VIEW */
          <div className="result-card">
            <h2>Result & Answer Sheet: {activeTest.title}</h2>
            <p className="result-subtitle">
              Detailed performance score and step-by-step solution formulas for each question.
            </p>

            <div className={`score-summary-circle ${scoreColor}`}>
              <div className="big-score">{result?.percentage}%</div>
              <span style={{ fontSize: "0.85rem" }}>Score: {result?.score} / {result?.total_marks}</span>
            </div>

            <div className="result-stats-grid">
              <div className="res-stat-item green">
                <span className="res-val">{result?.correct_answers}</span>
                <span className="res-lbl">Correct</span>
              </div>
              <div className="res-stat-item red">
                <span className="res-val">{result?.wrong_answers || 0}</span>
                <span className="res-lbl">Wrong</span>
              </div>
              <div className="res-stat-item gray">
                <span className="res-val">{result?.unanswered || 0}</span>
                <span className="res-lbl">Unanswered</span>
              </div>
              <div className="res-stat-item blue">
                <span className="res-val">{result?.time_taken_seconds || 120}s</span>
                <span className="res-lbl">Time Taken</span>
              </div>
            </div>

            {/* DETAILED QUESTION & SOLUTION SHEET */}
            <div className="explanations-section">
              <h3 style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem", color: "#003896" }}>
                Detailed Question Answer Sheet & Formulas
              </h3>
              {(result?.evaluated_questions || questions).map((q, idx) => {
                const userAns = answers[idx] !== undefined ? answers[idx] : q.user_choice;
                const isCorrect = q.is_correct !== undefined ? q.is_correct : (userAns === q.correct_answer);
                const correctIdx = q.correct_answer !== undefined ? q.correct_answer : 0;

                return (
                  <div key={idx} className={`exp-card ${isCorrect ? "correct" : "incorrect"}`}>
                    <h4 style={{ margin: "0 0 0.6rem 0", color: "#0f172a", fontWeight: "700" }}>
                      Q{idx + 1}: {q.question}
                    </h4>

                    {/* CHOICE SELECTED BY STUDENT */}
                    <div style={{ marginBottom: "0.5rem", fontSize: "0.92rem" }}>
                      <strong>Option You Selected: </strong>
                      <span className={isCorrect ? "user-ans-correct" : "user-ans-wrong"}>
                        {userAns !== undefined && q.options && q.options[userAns] ? q.options[userAns] : "Not Answered"}
                        {isCorrect ? " ✓ (Correct)" : " ✗ (Incorrect)"}
                      </span>
                    </div>

                    {/* CORRECT ANSWER */}
                    <div style={{ marginBottom: "0.75rem", fontSize: "0.92rem", color: "#166534" }}>
                      <strong>Correct Option: </strong>
                      <span style={{ fontWeight: "700" }}>
                        {q.options && q.options[correctIdx] ? q.options[correctIdx] : "Option " + String.fromCharCode(65 + correctIdx)}
                      </span>
                    </div>

                    {/* FORMULA & STEP-BY-STEP SOLUTION */}
                    <div className="solution-formula-box">
                      {q.formula && (
                        <div className="formula-line">
                          <strong>💡 Key Formula / Rule: </strong>
                          <code>{q.formula}</code>
                        </div>
                      )}
                      <div className="step-solution-line">
                        <strong>📝 How to Solve (Step-by-Step Solution):</strong>
                        <p style={{ margin: "0.35rem 0 0 0", whiteSpace: "pre-line", lineHeight: "1.5" }}>
                          {q.explanation || "Apply standard aptitude formula calculation step by step."}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <button onClick={() => navigate("/student/history")} className="btn-secondary-action">
                ← Go to Test History
              </button>
              <button onClick={() => setActiveTest(null)} className="btn-secondary-action" style={{ marginLeft: "0.5rem" }}>
                ← Back to Assessments List
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AptitudeModule;

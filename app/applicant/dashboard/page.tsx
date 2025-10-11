"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  LockClosedIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface VKInfo {
  identifier: string;
  selectionType: string;
  organizationalUnit: string;
  serviceField: string;
  position: string;
  serviceType: string;
  date: string;
}

interface TestSession {
  id: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  startedAt?: string;
  completedAt?: string;
  serverStartTime?: string;
  durationSeconds?: number;
  score?: number;
  maxScore?: number;
  passed?: boolean;
  answeredQuestions?: number;
}

interface Test {
  vkTestId: string;
  level: number;
  test: {
    id: string;
    name: string;
    type: string;
  };
  questionCount?: number;
  durationMinutes?: number;
  minScore?: number;
  session: TestSession | null;
  locked: boolean;
  lockedReason?: string;
}

interface DashboardData {
  vk: VKInfo;
  tests: Test[];
}

function getQuestionWord(count: number) {
  if (count === 1) return "otázka";
  if (count >= 2 && count <= 4) return "otázky";
  return "otázok";
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = [
    "januára",
    "februára",
    "marca",
    "apríla",
    "mája",
    "júna",
    "júla",
    "augusta",
    "septembra",
    "októbra",
    "novembra",
    "decembra",
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}. ${month} ${year}`;
}

function CountdownTimer({
  serverStartTime,
  durationSeconds,
}: {
  serverStartTime: string;
  durationSeconds: number;
}) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const startTime = new Date(serverStartTime).getTime();
      const endTime = startTime + durationSeconds * 1000;
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      return remaining;
    };

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [serverStartTime, durationSeconds]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <span data-testid={`test-time-remaining`}>
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}

function TestCard({
  test,
  onStartTest,
  onContinueTest,
  onViewResult,
}: {
  test: Test;
  onStartTest: (vkTestId: string) => void;
  onContinueTest: (sessionId: string) => void;
  onViewResult: (sessionId: string) => void;
}) {
  const { level, test: testInfo, session, locked, lockedReason } = test;

  // Debug log
  console.log(`Test Level ${level}:`, {
    questionCount: test.questionCount,
    hasSession: !!session,
    isLocked: locked,
    sessionStatus: session?.status
  });

  // Determine status
  let statusText = "Nespustený";
  let statusColor = "bg-gray-100 text-gray-800";
  let icon = <DocumentTextIcon className="h-6 w-6 text-gray-400" />;

  if (locked) {
    statusText = "Uzamknutý";
    statusColor = "bg-gray-50 text-gray-500";
    icon = <LockClosedIcon className="h-6 w-6 text-gray-400" />;
  } else if (session) {
    if (session.status === "IN_PROGRESS") {
      statusText = "Prebieha";
      statusColor = "bg-blue-100 text-blue-800";
      icon = <ClockIcon className="h-6 w-6 text-blue-500" />;
    } else if (session.status === "COMPLETED") {
      if (session.passed) {
        statusText = "Dokončený";
        statusColor = "bg-green-100 text-green-800";
        icon = <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      } else {
        statusText = "Neprešiel";
        statusColor = "bg-red-100 text-red-800";
        icon = <XCircleIcon className="h-6 w-6 text-red-500" />;
      }
    }
  }

  return (
    <div
      data-testid={`test-card-${level}`}
      className={`border rounded-lg p-6 bg-white ${locked ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">{icon}</div>

        <div className="flex-grow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Level {level}: {testInfo.name}
            </h3>
            <span
              data-testid={`test-status-badge-${level}`}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
            >
              {statusText}
            </span>
          </div>

          {/* Test info - always show question count */}
          {!locked && test.questionCount && !session && (
            <div className="text-sm text-gray-600 mb-4">
              <p>
                Počet otázok:{" "}
                <strong className="text-gray-900">
                  {test.questionCount} {getQuestionWord(test.questionCount)}
                </strong>
              </p>
            </div>
          )}

          {/* Session info */}
          {session && session.status === "IN_PROGRESS" && (
            <div className="space-y-1 text-sm text-gray-600 mb-4">
              <p>
                Zostávajúci čas:{" "}
                {session.serverStartTime && session.durationSeconds && (
                  <strong className="text-gray-900">
                    <CountdownTimer
                      serverStartTime={session.serverStartTime}
                      durationSeconds={session.durationSeconds}
                    />
                  </strong>
                )}
              </p>
              {session.answeredQuestions !== undefined &&
                test.questionCount && (
                  <p data-testid={`test-progress-${level}`}>
                    Zodpovedané:{" "}
                    <strong className="text-gray-900">
                      {session.answeredQuestions}/{test.questionCount}{" "}
                      {getQuestionWord(test.questionCount)}
                    </strong>
                  </p>
                )}
            </div>
          )}

          {session && session.status === "COMPLETED" && (
            <div className="space-y-1 text-sm text-gray-600 mb-4">
              <p data-testid={`test-score-${level}`}>
                Výsledok:{" "}
                <strong className="text-gray-900">
                  {session.score}/{session.maxScore} bodov (
                  {Math.round((session.score! / session.maxScore!) * 100)}%)
                </strong>
              </p>
              {test.questionCount && (
                <p>
                  Počet otázok:{" "}
                  <strong className="text-gray-900">
                    {test.questionCount} {getQuestionWord(test.questionCount)}
                  </strong>
                </p>
              )}
              <p>
                Prešiel:{" "}
                <strong
                  className={session.passed ? "text-green-600" : "text-red-600"}
                >
                  {session.passed ? "Áno" : "Nie"}
                </strong>
              </p>
            </div>
          )}

          {locked && lockedReason && (
            <p
              className="text-sm text-gray-500 mb-4"
              data-testid={`locked-message-${level}`}
            >
              Tento test sa sprístupní po úspešnom dokončení {lockedReason}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-4">
            {locked ? (
              <button
                disabled
                className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md bg-gray-200 text-gray-400 cursor-not-allowed"
              >
                Uzamknutý
              </button>
            ) : (
              <>
                {!session && (
                  <button
                    onClick={() => onStartTest(test.vkTestId)}
                    data-testid={`start-test-button-${level}`}
                    className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Začať test
                  </button>
                )}

                {session && session.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => onContinueTest(session.id)}
                    data-testid={`continue-test-button-${level}`}
                    className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Pokračovať v teste
                  </button>
                )}

                {session && session.status === "COMPLETED" && (
                  <button
                    onClick={() => onViewResult(session.id)}
                    data-testid={`view-result-button-${level}`}
                    className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Zobraziť výsledok
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApplicantDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/applicant/dashboard");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Chyba pri načítaní dashboardu");
      }

      const dashboardData = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStartTest = async (vkTestId: string) => {
    try {
      toast.loading("Spúšťam test...");

      const response = await fetch("/api/applicant/test/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vkTestId }),
      });

      toast.dismiss();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Chyba pri spúšťaní testu");
      }

      const data = await response.json();
      router.push(`/applicant/test/${data.sessionId}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleContinueTest = (sessionId: string) => {
    router.push(`/applicant/test/${sessionId}`);
  };

  const handleViewResult = (sessionId: string) => {
    router.push(`/applicant/test/${sessionId}/result`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">Načítavam...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Chyba pri načítaní</p>
          <p className="text-gray-600 mb-4">{error || "Neznáma chyba"}</p>
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Skúsiť znova
          </button>
        </div>
      </div>
    );
  }

  const { vk, tests } = data;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-6" data-testid="applicant-dashboard-page">
          {/* VK Header Card */}
          <div
            className="border border-gray-200 bg-white rounded-lg p-6"
            data-testid="vk-header"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Informácie o výberovom konaní
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Identifikátor</dt>
                <dd className="text-gray-900">{vk.identifier}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Druh VK</dt>
                <dd className="text-gray-900">{vk.selectionType}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Organizačný útvar</dt>
                <dd className="text-gray-900">{vk.organizationalUnit}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">
                  Odbor štátnej služby
                </dt>
                <dd className="text-gray-900">{vk.serviceField}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">
                  Obsadzovaná funkcia
                </dt>
                <dd className="text-gray-900">{vk.position}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">
                  Druh štátnej služby
                </dt>
                <dd className="text-gray-900">{vk.serviceType}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Dátum VK</dt>
                <dd className="text-gray-900">{formatDate(vk.date)}</dd>
              </div>
            </dl>
          </div>

          {/* Tests */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Testy</h2>
            <div className="space-y-4">
              {tests.map((test) => (
                <TestCard
                  key={test.vkTestId}
                  test={test}
                  onStartTest={handleStartTest}
                  onContinueTest={handleContinueTest}
                  onViewResult={handleViewResult}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

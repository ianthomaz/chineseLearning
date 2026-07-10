import { LoginGate } from "@/components/AuthGate";
import { QuizGame } from "@/components/QuizGame";
import { getQuizBank } from "@/lib/gamification/bank";



export default function GamificationPage() {
  return (
    <LoginGate>
      <QuizGame quizBank={getQuizBank()} />
    </LoginGate>
  );
}

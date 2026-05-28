import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { MobileContainer } from "@/components/layout/mobile-container";

export default function NotFound() {
  return (
    <MobileContainer>
      <div className="flex w-full h-full items-center justify-center p-6">
        <div className="w-full max-w-sm surface-card p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
              <AlertCircle className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">페이지를 찾을 수 없어요</h1>
          <p className="text-muted-foreground mb-6">
            요청하신 페이지가 사라졌거나 잘못된 경로입니다.
          </p>
          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </MobileContainer>
  );
}

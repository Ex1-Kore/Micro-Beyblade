import {
  ApiConfigError,
  ApiHttpError,
  ApiNetworkError,
} from "@/lib/api-client";

interface ApiErrorStateProps {
  error: unknown;
}

/** Renders a clear error state when the CMS API is unreachable or misconfigured. */
export function ApiErrorState({ error }: ApiErrorStateProps) {
  let title = "เกิดข้อผิดพลาด";
  let detail = "ไม่สามารถโหลดข้อมูลได้ในขณะนี้";

  if (error instanceof ApiConfigError) {
    title = "ตั้งค่าไม่ครบ";
    detail = error.message;
  } else if (error instanceof ApiNetworkError) {
    title = "เชื่อมต่อ CMS ไม่ได้";
    detail = `${error.message} — ตรวจสอบว่า CMS ทำงานอยู่และ CORS อนุญาต origin นี้`;
  } else if (error instanceof ApiHttpError) {
    title = `CMS ตอบกลับด้วยสถานะ ${error.status}`;
    detail = error.message;
  } else if (error instanceof Error) {
    detail = error.message;
  }

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm"
    >
      <p className="font-semibold text-red-800">{title}</p>
      <p className="mt-1 text-red-700">{detail}</p>
    </div>
  );
}

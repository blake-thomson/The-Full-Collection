"use client";

export function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="text-[13px] text-[#FCA5A5] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] rounded-lg py-[9px] px-[14px]">
      {msg}
    </div>
  );
}

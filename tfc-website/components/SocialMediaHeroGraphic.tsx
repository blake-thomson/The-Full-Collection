"use client";

import { motion } from "framer-motion";

const PLATFORMS = [
  { label: "TikTok", color: "bg-white/10 text-white/60", dot: "bg-white/30" },
  { label: "Instagram", color: "bg-pink-500/20 text-pink-300", dot: "bg-pink-400" },
  { label: "YouTube", color: "bg-red/20 text-red", dot: "bg-red" },
  { label: "Shorts", color: "bg-red/10 text-red/60", dot: "bg-red/40" },
];

const QUEUE = [
  { title: "Behind the Scenes Drop", platform: "IG", time: "Today 9:00 AM", status: "scheduled", color: "bg-pink-500/20 text-pink-300" },
  { title: "Weekly Vlog Teaser", platform: "TT", time: "Today 12:00 PM", status: "scheduled", color: "bg-white/10 text-white/60" },
  { title: "Product Launch Reel", platform: "YT", time: "Today 3:00 PM", status: "drafting", color: "bg-red/20 text-red" },
  { title: "Q&A Clip Series", platform: "IG", time: "Tomorrow 10:00 AM", status: "pending", color: "bg-pink-500/20 text-pink-300" },
];

const STATS = [
  { label: "Posts This Week", value: "14" },
  { label: "Total Reach", value: "284K" },
];

export function SocialMediaHeroGraphic() {
  return (
    <div className="w-full h-full bg-[#0D0D0D] rounded-2xl overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red" />
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-white/50">TFC Portal — Social</span>
        </div>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-1"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[8px] text-green-400/80 font-medium">Synced</span>
        </motion.div>
      </div>

      {/* Platform pills */}
      <div className="flex gap-1.5 px-4 pt-3 pb-2 flex-wrap">
        {PLATFORMS.map((p) => (
          <div key={p.label} className={`flex items-center gap-1 text-[7px] font-bold tracking-wide uppercase px-2 py-1 rounded-full ${p.color} border border-white/[0.06]`}>
            <div className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
            {p.label}
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex gap-2 px-4 pb-3">
        {STATS.map((s) => (
          <div key={s.label} className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-lg px-2.5 py-2">
            <div className="text-[10px] font-bold text-white">{s.value}</div>
            <div className="text-[7px] text-white/30 mt-0.5">{s.label}</div>
          </div>
        ))}
        <div className="flex-1 bg-red/10 border border-red/20 rounded-lg px-2.5 py-2">
          <div className="text-[10px] font-bold text-red">↑ 38%</div>
          <div className="text-[7px] text-red/50 mt-0.5">Engagement</div>
        </div>
      </div>

      {/* Post queue */}
      <div className="px-4 pb-1">
        <div className="text-[8px] font-bold tracking-[0.12em] uppercase text-white/25 mb-2">Posting Queue</div>
        <div className="flex flex-col gap-1.5">
          {QUEUE.map((post, i) => (
            <motion.div
              key={post.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.35 }}
              className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-2 hover:border-white/15 transition-colors duration-200"
            >
              <div className={`text-[7px] font-bold px-1.5 py-0.5 rounded ${post.color} flex-shrink-0`}>
                {post.platform}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[8px] text-white/70 truncate">{post.title}</div>
                <div className="text-[6px] text-white/25 mt-0.5">{post.time}</div>
              </div>
              <div className={`text-[6px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0 ${
                post.status === "scheduled" ? "bg-green-500/15 text-green-400" :
                post.status === "drafting" ? "bg-yellow-500/15 text-yellow-400" :
                "bg-white/10 text-white/30"
              }`}>
                {post.status}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import FeedItemChrome from "../src/features/feed/FeedItemChrome";
import { FeedMobileTopTools } from "../src/features/feed/FeedPlayerShellChrome";
import { PlaybackSettingsPanel } from "../src/features/feed/PlaybackSettingsPanel";
import { createPlaybackClock } from "../src/features/playback";
import type { FeedPanel } from "../src/features/feed/useFeedViewport";
import { Sheet } from "../src/shared/ui/ios/overlays";
import { TagBlockMenu } from "../src/shared/ui/TagBlockMenu";
import "../src/index.css";

const meta = {
  title: "示例剧名",
  cover: "",
  score: 8.6,
  like: 120,
  collect: 36,
  comment: 89,
  author: "示例作者",
  authorId: 7,
  tags: ["都市", "逆袭", "甜宠", "打脸"],
  desc: "示例简介",
  episodes: Array.from({ length: 109 }, (_, index) => ({ ep_num: index + 1, title: `第 ${index + 1} 集` })),
} as any;

function Probe() {
  const clock = useRef(createPlaybackClock()).current;
  const [panel, setPanel] = useState<FeedPanel>(null);
  const [tagMenu, setTagMenu] = useState(false);
  const [tagSelection, setTagSelection] = useState<string[]>([]);
  const [rate, setRate] = useState(1);
  const [preferHevc, setPreferHevc] = useState(true);
  const [portraitFit, setPortraitFit] = useState<"contain" | "cover">("contain");
  const [swipeEp, setSwipeEp] = useState(true);
  const [muted, setMuted] = useState(true);
  const [openedTag, setOpenedTag] = useState("");
  const [fullscreen, setFullscreen] = useState<boolean | null>(null);
  const openTagMenu = (selected: string[] = []) => {
    setTagSelection(selected);
    setPanel(null);
    setTagMenu(true);
  };
  useEffect(() => {
    Object.assign(window, {
      homeControlsProbe: {
        panel: () => panel,
        rate: () => rate,
        preferHevc: () => preferHevc,
        portraitFit: () => portraitFit,
        swipeEp: () => swipeEp,
        muted: () => muted,
        openedTag: () => openedTag,
        fullscreen: () => fullscreen,
        tagSelection: () => tagSelection,
      },
    });
  });
  return <div className="probe-stage">
    <FeedItemChrome
      isActive isDesktop={false} fs={false} clean={false} mode="home" kind="video" title="示例剧名"
      index={0} effectiveLength={1} bottomInset={0} curEp={1} duration={120} meta={meta} hevcUrl="hevc.mp4"
      preferHevc={preferHevc} setPreferHevc={setPreferHevc}
      landscapeVideo={false} capsuleOn={false} zoom={{ s: 1, x: 0, y: 0, g: false }} setZoom={() => {}}
      portraitFit={portraitFit} setPortraitFit={setPortraitFit}
      liked={false} collected={false} likePending={false} collectPending={false} heartBurst={0}
      likeCount={120} collectCount={36} paused={false} waiting={false} err="" scrub={null}
      barRef={{ current: null }} barPct={null} playbackClock={clock}
      onBack={() => {}} enterFs={landscape => setFullscreen(landscape)} stepDir={() => {}} canStep={() => false}
      onLike={async () => {}} onFav={async () => {}} setPanel={setPanel}
      openTag={setOpenedTag} openTagMenu={openTagMenu}
      onBarDown={() => {}} onBarMove={() => {}} onBarUp={() => {}}
      onRetryStream={() => {}} toast={() => {}}
    />
    <FeedMobileTopTools
      isDesktop={false} controlsLocked={false} active fs={false} idle={false} rotated={false} clean={false}
      currentQuality={preferHevc ? "HD" : "SD"} muted={muted} onToggleMuted={() => setMuted(value => !value)}
      swipeEnabled swipeEp={swipeEp} onToggleSwipe={() => setSwipeEp(value => !value)}
    />
    <Sheet open={panel === "more"} label="播放设置" z="playback-settings-overlay" onClose={() => setPanel(null)}>
      <PlaybackSettingsPanel
        rate={rate} onRate={setRate} preferHevc={preferHevc} onPreferHevc={setPreferHevc}
        portraitFit={portraitFit} onPortraitFit={setPortraitFit} onClose={() => setPanel(null)}
      />
    </Sheet>
    <TagBlockMenu open={tagMenu} tags={meta.tags} initialSelected={tagSelection} onClose={() => setTagMenu(false)} />
  </div>;
}

createRoot(document.querySelector("#root")!).render(<Probe />);

import { Button } from "../../shared/ui/ios/controls";
import { IChevR, IClose } from "../../shared/ui/icons";
import { Toggle } from "../../shared/ui/ui";

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function PlaybackSettingsPanel({ rate, onRate, preferHevc, onPreferHevc, portraitFit, onPortraitFit,
  swipeEp, onSwipeEp, muted, onMuted, onLock, onNotInterested, onClose }: {
  rate: number;
  onRate: (rate: number) => void;
  preferHevc: boolean;
  onPreferHevc: (on: boolean) => void;
  portraitFit: "contain" | "cover";
  onPortraitFit: (fit: "contain" | "cover") => void;
  swipeEp: boolean;
  onSwipeEp: (on: boolean) => void;
  muted: boolean;
  onMuted: (on: boolean) => void;
  onLock: () => void;
  onNotInterested: () => void;
  onClose: () => void;
}) {
  return <div className="playback-settings-sheet">
    <header className="playback-settings-header">
      <div><h2>播放设置</h2><p>不影响当前播放进度</p></div>
      <Button aria-label="关闭播放设置" className="ios-icon-button" onClick={onClose}><IClose size={18} /></Button>
    </header>
    <div className="playback-settings-list">
      <div className="playback-setting-row">
        <span className="playback-setting-label">优先高清<small>开启后默认高清，关闭后默认标清</small></span>
        <Toggle on={preferHevc} onChange={onPreferHevc} label="优先高清" />
      </div>
      <div className="playback-setting-row">
        <span className="playback-setting-label">画面尺寸</span>
        <div className="playback-setting-segments" role="group" aria-label="画面尺寸">
          <Button aria-pressed={portraitFit === "contain"} onClick={() => onPortraitFit("contain")}>适应</Button>
          <Button aria-pressed={portraitFit === "cover"} onClick={() => onPortraitFit("cover")}>铺满</Button>
        </div>
      </div>
      <div className="playback-setting-row playback-setting-rate-row">
        <span className="playback-setting-label">倍速</span>
        <div className="playback-setting-segments playback-setting-rates" role="group" aria-label="播放倍速">
          {RATES.map(value => <Button key={value} aria-pressed={rate === value} aria-label={`倍速 ${value} 倍`} onClick={() => onRate(value)}>{value}×</Button>)}
        </div>
      </div>
      <div className="playback-setting-row">
        <span className="playback-setting-label">上下划切集<small>开启后，上下滑动切换当前剧集</small></span>
        <Toggle on={swipeEp} onChange={onSwipeEp} label="上下划切集" />
      </div>
      <div className="playback-setting-row">
        <span className="playback-setting-label">静音</span>
        <Toggle on={muted} onChange={onMuted} label="静音" />
      </div>
      <Button className="playback-setting-row playback-setting-action" onClick={onLock}>
        <span className="playback-setting-label">屏幕锁定<small>隐藏屏幕操作按钮，避免误触</small></span><IChevR size={17} />
      </Button>
      <Button className="playback-setting-row playback-setting-action" onClick={onNotInterested}>
        <span className="playback-setting-label">不感兴趣<small>选择并屏蔽当前视频的标签</small></span><IChevR size={17} />
      </Button>
    </div>
  </div>;
}

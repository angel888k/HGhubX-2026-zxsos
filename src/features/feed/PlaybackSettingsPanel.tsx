import { Button, SegmentedControl, Surface } from "../../shared/ui/ios/controls";
import { Toggle } from "../../shared/ui/ui";
import {
  IBoltF, IChevR, IClock, IClose, IExpand, IEyeOff, ILockF, IVertSwap, IVolMute,
} from "../../shared/ui/icons";

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
      <Surface className="ios-setting-group playback-settings-group">
        <div className="ios-settings-row playback-setting-row">
          <span className="ios-setting-icon"><IBoltF size={16} /></span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] text-on">优先高清</div>
            <div className="text-[12px] text-mut">开启后默认高清，关闭后默认标清</div>
          </div>
          <Toggle desktop on={preferHevc} onChange={onPreferHevc} label="优先高清" />
        </div>
        <div className="ios-settings-row playback-setting-row">
          <span className="ios-setting-icon"><IExpand size={16} /></span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] text-on">画面尺寸</div>
            <div className="text-[12px] text-mut">竖屏视频的填充方式</div>
          </div>
          <SegmentedControl className="playback-setting-size" aria-label="画面尺寸" activeIndex={portraitFit === "contain" ? 0 : 1}>
            <Button aria-pressed={portraitFit === "contain"} onClick={() => onPortraitFit("contain")}>适应</Button>
            <Button aria-pressed={portraitFit === "cover"} onClick={() => onPortraitFit("cover")}>铺满</Button>
          </SegmentedControl>
        </div>
        <div className="ios-settings-row playback-setting-row playback-setting-rate-row">
          <span className="ios-setting-icon"><IClock size={16} /></span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] text-on">倍速</div>
            <div className="text-[12px] text-mut">立即应用到当前视频</div>
          </div>
          <SegmentedControl className="playback-setting-rates" aria-label="播放倍速" activeIndex={RATES.indexOf(rate)}>
            {RATES.map(value => <Button key={value} aria-pressed={rate === value} aria-label={`倍速 ${value} 倍`} onClick={() => onRate(value)}>{value}×</Button>)}
          </SegmentedControl>
        </div>
        <div className="ios-settings-row playback-setting-row">
          <span className="ios-setting-icon"><IVertSwap size={16} /></span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] text-on">上下划切集</div>
            <div className="text-[12px] text-mut">开启后，上下滑动切换当前剧集</div>
          </div>
          <Toggle desktop on={swipeEp} onChange={onSwipeEp} label="上下划切集" />
        </div>
        <div className="ios-settings-row playback-setting-row">
          <span className="ios-setting-icon"><IVolMute size={16} /></span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] text-on">静音</div>
            <div className="text-[12px] text-mut">关闭当前视频的声音</div>
          </div>
          <Toggle desktop on={muted} onChange={onMuted} label="静音" />
        </div>
      </Surface>
      <Surface className="ios-setting-group playback-settings-group playback-settings-actions">
        <Button className="ios-settings-row playback-setting-row playback-setting-action" onClick={onLock}>
          <span className="ios-setting-icon"><ILockF size={16} /></span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] text-on">屏幕锁定</div>
            <div className="text-[12px] text-mut">隐藏屏幕操作按钮，避免误触</div>
          </div>
          <IChevR size={15} className="text-mut" />
        </Button>
        <Button className="ios-settings-row playback-setting-row playback-setting-action" onClick={onNotInterested}>
          <span className="ios-setting-icon"><IEyeOff size={16} /></span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] text-on">不感兴趣</div>
            <div className="text-[12px] text-mut">选择并屏蔽当前视频的标签</div>
          </div>
          <IChevR size={15} className="text-mut" />
        </Button>
      </Surface>
    </div>
  </div>;
}

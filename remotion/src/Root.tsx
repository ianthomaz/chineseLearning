import React from "react";
import { Composition } from "remotion";
import { StoreHeader } from "./compositions/StoreHeader";
import { StoreSearch } from "./compositions/StoreSearch";
import { Reel1DailyRoutine } from "./compositions/Reel1_DailyRoutine";
import { Reel2VisualHanzi } from "./compositions/Reel2_VisualHanzi";
import { Reel3PhrasesAction } from "./compositions/Reel3_PhrasesAction";
import { Reel4PhraseGame } from "./compositions/Reel4_PhraseGame";
import { Reel5WidgetHome } from "./compositions/Reel5_WidgetHome";
import { Reel6StrokeCalligraphy } from "./compositions/Reel6_StrokeCalligraphy";

export const Root: React.FC = () => {
  return (
    <>
      {/* App Store Custom Product Page Header (Static + Animated) */}
      <Composition
        id="StoreHeader"
        component={StoreHeader}
        durationInFrames={300}
        fps={30}
        width={3840}
        height={1646}
      />

      {/* App Store Search Result Feature Graphic (Static + Animated) */}
      <Composition
        id="StoreSearch"
        component={StoreSearch}
        durationInFrames={300}
        fps={30}
        width={3840}
        height={2560}
      />

      {/* Reel 1: Daily Mandarin Routine (Microlearning habit) */}
      <Composition
        id="Reel1_DailyRoutine"
        component={Reel1DailyRoutine}
        durationInFrames={300} // 10s
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Reel 2: Visual Hanzi Mastery */}
      <Composition
        id="Reel2_VisualHanzi"
        component={Reel2VisualHanzi}
        durationInFrames={300} // 10s
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Reel 3: Contextual Phrases in Action */}
      <Composition
        id="Reel3_PhrasesAction"
        component={Reel3PhrasesAction}
        durationInFrames={300} // 10s
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Reel 4: Feature Focus - Phrase Game */}
      <Composition
        id="Reel4_PhraseGame"
        component={Reel4PhraseGame}
        durationInFrames={360} // 12s
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Reel 5: Feature Focus - Hanzi Memorize iOS Widget */}
      <Composition
        id="Reel5_WidgetHome"
        component={Reel5WidgetHome}
        durationInFrames={360} // 12s
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Reel 6: Feature Focus - Hanzi Stroke Order & Calligraphy */}
      <Composition
        id="Reel6_StrokeCalligraphy"
        component={Reel6StrokeCalligraphy}
        durationInFrames={360} // 12s
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

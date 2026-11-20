import { Composition } from "remotion";
import { AskDemo } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AskDemo"
      component={AskDemo}
      durationInFrames={620}
      fps={30}
      width={1280}
      height={720}
    />
  );
};

import { Fragment, useEffect, useState } from "react";
import { useAudioPlayer } from "react-use-audio-player";

const pfpFileName = "cypher-pfp.HD";
const sfxFileName = "transition_sfx_finale_01";

export default function Transition() {
  const audioPlayer = useAudioPlayer();

  const [activeState, setActiveState] = useState<boolean>(false);

  useEffect(() => {
    setActiveState(true);

    audioPlayer.load(`/transition_assets/${sfxFileName}.ogg`, {
      autoplay: true,
      initialVolume: 0.5
    });

    setTimeout(() => setActiveState(false), 1500);
  }, []);

  return (
    <Fragment>
      <link href={`/transition_assets/${sfxFileName}.ogg`} as={"audio"} rel={"preload"}/>
      <link href={`/transition_assets/${pfpFileName}.webp`} as={"image"} rel={"preload"}/>
      <link href={"/transition_assets/index.css"} as={"style"} rel={"preload stylesheet"}/>

      <section className={"transition-root"} data-active={activeState}>
        <div className={"pfp"}>
          <img src={`/transition_assets/${pfpFileName}.webp`} loading={"eager"} />
        </div>
      </section>
    </Fragment>
  );
};
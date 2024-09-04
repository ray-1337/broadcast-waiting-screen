import { useState, useEffect, useRef, Fragment } from "react";
import { currentSceneNameAfterAwait } from "../index";
import ms from "ms";

export default function ValorantReplayPage() {
  const [replayFootage, setReplayFootage] = useState<string[]>([]);
  const [currentIndex, setVideoIndex] = useState<number>(-1);
  const [replayTextState, setReplayTextState] = useState<boolean>(false);
  const videoRef = useRef<Array<HTMLVideoElement | null>>([]);

  const goBack = () => {
    if (typeof window.obsstudio !== "undefined") {
      window.obsstudio.setCurrentScene(currentSceneNameAfterAwait);
    };

    return;
  };

  const showNext = () => {
    const limit = replayFootage.length - 1;

    if (currentIndex >= limit) {
      // if all clips were all played, proceeds to go back to the main scene
      goBack();
    } else {
      setVideoIndex((prev) => (prev) + 1);
    };

    return;
  };

  const fetchFootage = async () => {
    try {
      const req = await fetch("/api/valorant/replay/currentReplay", {
        method: "GET"
      });

      const data = await req.json() as string[];

      if (!data?.length) {
        return goBack();
      };

      setReplayFootage(data);
    } catch (error) {
      console.error(error);

      goBack();
    };

    return;
  };

  useEffect(() => {
    if (currentIndex !== -1 && videoRef.current[currentIndex] !== null) {
      videoRef.current[currentIndex].play();
    };
  }, [currentIndex]);

  useEffect(() => {
    fetchFootage();
  }, []);

  useEffect(() => {
    if (replayFootage.length >= 1) {
      setTimeout(() => setReplayTextState(true), ms("1s"));

      setVideoIndex(0);
    };
  }, [replayFootage]);

  const defaultVideoAttribute = {
    loop: false,
    muted: false,
    autoPlay: false,
    controls: false,
    crossOrigin: "anonymous",
    playsInline: true,
    draggable: false,
    disablePictureInPicture: true,
    disableRemotePlayback: true
  };

  return (
    <Fragment>
      <link rel="preload stylesheet" href={"/unstabilized_css/replay.css"} as={"style"}/>

      <section className={"replay-root"}>
        {/* list of replays highlight */}
        <div className={"replay-video-container"}>
          {
            replayFootage.map((replayFile, index) => {
              return (
                <div className={"replay-video-individual"} data-active={index === currentIndex} key={index}>
                  <video
                    // @ts-expect-error
                    ref={ref => videoRef.current[index] = ref}

                    onEnded={showNext} preload={((currentIndex + 1) === index) ? "auto" : "none"} {...defaultVideoAttribute}

                    onTimeUpdate={(event) => {
                      if (currentIndex !== (replayFootage.length - 1)) {
                        return;
                      };

                      const [total, current] = [+(event.currentTarget.duration).toFixed(2), +(event.currentTarget.currentTime).toFixed(2)];

                      if ((total - current) <= 0.5) {
                        return showNext();
                      };
                    }}>
                    <source src={`/api/valorant/replay/fileID/${replayFile}`} type="video/mp4"/>
                  </video>
                </div>
              )
            })
          }
        </div>

        {/* replay text */}
        <div className={"replay-text-container"} data-active={replayTextState === true}>
          <div className={"replay-text-title"}>
            <h1>Highlights</h1>
          </div>

          <div className={"replay-text-tech"}>
            <p>Powered by</p>

            <img src={"/images/outplayed_logo.svg"} loading={"eager"} />
          </div>
        </div>
      </section>
    </Fragment>
  );
};
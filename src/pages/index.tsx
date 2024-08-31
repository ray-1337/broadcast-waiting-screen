import type { InferGetServerSidePropsType, GetServerSidePropsContext } from "next";
import { useEffect, useState, useRef, Fragment, type VideoHTMLAttributes, type FC } from "react";
import { useAudioPlayer, type AudioPlayer } from 'react-use-audio-player';
import ms from "ms";
import { readdir } from "node:fs/promises";
import path from "node:path";

function getRandomIntInclusive(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
};

const waitTitle: string = "A special cross-platform broadcast, presented by ray";

const currentSceneNameAfterAwait: string = "🎮 VALORANT MAIN";

const promotionStartInBelowTime: number = ms("3m");

const Homepage: FC<InferGetServerSidePropsType<typeof getServerSideProps>> = (props) => {
  const audioPlayer = useAudioPlayer();

  const [windowWidthSize, setWindowWidthSize] = useState<number>(0);

  // in minutes
  const initialTime = ms(`${props.timeWait}m`);
  const [isFinished, setFinishedState] = useState<boolean>(false);
  const [timerStarted, setTimerStartState] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(initialTime);
  
  // songs
  const songs = props.waiting_audios;
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [previousSongIndex, setPrevSongIndex] = useState<number | null>(null);
  const [isSongChanged, setSongChangeState] = useState<boolean>(false);

  // promotion videos
  const promotionVideos = props.promotion_videos;
  const [currentPromotionVideo, setCurrentPromotionVideo] = useState<string | null>(null);
  const [isPromotionPlayed, setPromotionPlayState] = useState<boolean>(false);
  const [isPromotionFinished, setPromotionFinishState] = useState<boolean>(false);
  const promotionVideoComponent = useRef<HTMLVideoElement | null>(null);

  const getRandomSongIndex = () => {
    let newNum: number = 0;

    while (true) {
      newNum = getRandomIntInclusive(0, songs.length - 1);

      if (newNum !== previousSongIndex) {
        break;
      };
    };

    setPrevSongIndex(newNum);

    return newNum;
  };

  const playSongs = () => {
    const songFileName = songs[getRandomSongIndex()].split(/\.mp3/gim).shift() as string;

    audioPlayer.load("/waiting_audios/" + encodeURI(songFileName + ".mp3"), {
      onend: () => playSongs(),
      autoplay: true,
      initialVolume: 1
    });

    return setCurrentSong(songFileName);
  };

  const fadeAudio = (player: AudioPlayer, type: "in" | "out", intervalTime = 50) => {
    let initialVolume = player.volume;

    const fade = setInterval(() => {
      if (type === "in") {
        initialVolume += 0.01;
      } else if (type === "out") {
        initialVolume -= 0.01;
      };

      player.setVolume(initialVolume);

      if (initialVolume <= 0 && type === "out") {
        clearInterval(fade);
        player.setVolume(0);
      } else if (initialVolume >= 1 && type === "in") {
        clearInterval(fade);
        player.setVolume(1);
      };
    }, intervalTime);

    return;
  };

  const playPromotionVideo = () => {
    if (process.env.NODE_ENV === "development") {
      console.log("promotion video played");
    };

    const randomPromotionVideo = promotionVideos[getRandomIntInclusive(0, promotionVideos.length - 1)];

    setPromotionPlayState(true);
    
    return setCurrentPromotionVideo(randomPromotionVideo);
  };

  const finishPromotionVideo = () => {
    if (process.env.NODE_ENV === "development") {
      console.log("promotion video finished");
    };

    if (promotionVideoComponent.current !== null) {
      setTimeout(() => promotionVideoComponent?.current?.pause(), ms("1s"));
    };

    setPromotionFinishState(true);

    // ew
    setTimeout(() => audioPlayer.play(), 1000);
    setTimeout(() => audioPlayer.setVolume(0), 1002);
    setTimeout(() => fadeAudio(audioPlayer, "in"), 1005);
    
    return;
  };

  useEffect(() => {
    if (currentSong !== null) {
      setTimeout(() => setSongChangeState(true), 2500);
    };
  }, [currentSong])

  useEffect(() => {
    if (typeof isSongChanged === "boolean" && isSongChanged === true) {
      setTimeout(() => setSongChangeState(false), ms("5s"));
    };
  }, [isSongChanged]);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window?.innerWidth === "number") {
      setWindowWidthSize(window.innerWidth);
    };

    // cleanup
    try {
      audioPlayer.cleanup();
    } catch {};

    // play songs
    setTimeout(() => playSongs(), 1500);
  }, []);

  useEffect(() => {
    // time out, change scene
    if (currentTime <= ms("4s") && timerStarted === true) {
      fadeAudio(audioPlayer, "out");

      setTimeout(() => {
        setFinishedState(true);
        audioPlayer.cleanup();

        setTimeout(() => {
          if (typeof window.obsstudio !== "undefined") {
            window.obsstudio.setCurrentScene(currentSceneNameAfterAwait);
          };
        }, 2000);
      }, 5000);

      return;
    };

    // times ticking
    if (currentTime > 0 && timerStarted !== true) {
      setTimerStartState(true);

      const interval = setInterval(() => {
        if (currentTime <= 0) {
          return clearInterval(interval);
        };

        return setCurrentTime((prev) => prev - 1000);
      }, ms("1s"));
    };

    // promotion video
    if (currentTime <= (promotionStartInBelowTime) && !isPromotionPlayed && promotionVideos.length > 0) {
      setPromotionPlayState(true);

      playPromotionVideo();
      
      fadeAudio(audioPlayer, "out");
      setTimeout(() => audioPlayer.pause(), promotionStartInBelowTime);
    };

    if (currentTime <= ms("10s") && isPromotionPlayed && !isPromotionFinished) {
      finishPromotionVideo();
    };
  }, [currentTime]);

  let defaultVideoAttribute: VideoHTMLAttributes<HTMLVideoElement> = {
    autoPlay: true,
    playsInline: true,
    disablePictureInPicture: true,
    disableRemotePlayback: true,
    preload: "auto",
    draggable: false,
    controls: false
  };

  return (
    <Fragment>
      <link rel="preload" href={"/unstabilized_css/index.css"} as={"style"}/>
      <link rel="stylesheet" href={"/unstabilized_css/index.css"} as={"style"}/>
      
      {/* promotion screen // ONLY OCCURS WHEN THE INITIAL TIME IS ABOVE 10 MINS */}
      <section className={"promotion"} data-active={!isPromotionFinished && currentPromotionVideo !== null}>
        <section className={"promotion-timer-container"}>
          <div className={"promotion-timer"}>
            <p>Starting in</p>
            <h1>{new Date(currentTime <= 0 ? 0 : currentTime).toISOString().slice(11, 19)}</h1>
          </div>
        </section>

        <section className={"promotion-video"}>
          {/* backlay */}
          {
            (windowWidthSize <= 1080 && currentPromotionVideo !== null) && (
              <div className={"promotion-video-underlay"}>
                <video loop={false} muted={true} {...defaultVideoAttribute}>
                  <source src={"/promotion_videos/" + currentPromotionVideo} type="video/mp4"/>
                </video>
              </div>
            )
          }

          {
            currentPromotionVideo !== null && (
              <video ref={promotionVideoComponent} onEnded={finishPromotionVideo} loop={false} muted={false} {...defaultVideoAttribute}>
                <source src={"/promotion_videos/" + currentPromotionVideo} type="video/mp4"/>
              </video>
            )
          }
        </section>
      </section>

      {/* main screen */}
      <section className={"frontpage"} data-disappear-if={isPromotionPlayed && !isPromotionFinished} data-finished={isFinished} data-started={currentSong !== null}>
        {/* transition */}
        <div className={"transition"} data-active={isFinished}/>

        {/* details */}
        <section className={"details"} data-active={currentSong !== null}>
          <div className={"details_box"}>
            {/* timer */}
            <div className={"timer"}>
              <h6>{waitTitle}</h6>

              <h1>{new Date(currentTime <= 0 ? 0 : currentTime).toISOString().slice(11, 19)}</h1>
            </div>
            
            {/* now playing */}
            <div className={"nowplaying"} data-changed={currentTime >= ms("10s") && isSongChanged} data-disappear-if={currentTime <= ms("3s")} data-active={currentSong !== null}>
              <h6>Now playing</h6>
              
              <p>{currentSong}</p>
            </div>
          </div>
        </section>

        {/* video */}
        <section className={"video"}>
          <video loop={true} muted={true} {...defaultVideoAttribute}>
            <source src={`/loading_room/${props.loadingRoomFootage}?s=${Date.now()}#t=${getRandomIntInclusive(1, 14)}`} type="video/mp4"/>
          </video>
        </section>
      </section>
    </Fragment>
  );
};

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const [rawAudioFilesList, loadingRoomList] = await Promise.all([
    readdir(path.join(process.cwd(), "public", "waiting_audios")),
    readdir(path.join(process.cwd(), "public", "loading_room"))
  ]);

  const waiting_audios = rawAudioFilesList
  .filter((file) => file.endsWith(".mp3"))
  .map((file) => file.replace(/\꞉/gim, ":"));

  let timeWait = Number(ctx.query?.timewait);
  if (!timeWait || isNaN(timeWait)) {
    timeWait = 2;
  };

  let promotion_videos: string[] = [];
  const initialTimeWait = ms(`${timeWait}m`);
  if (initialTimeWait >= promotionStartInBelowTime) {
    promotion_videos = await readdir(path.join(process.cwd(), "public", "promotion_videos"));
  };

  return {
    props: {
      waiting_audios, promotion_videos, timeWait,
      loadingRoomFootage: loadingRoomList[0]
    }
  };
};

export default Homepage;
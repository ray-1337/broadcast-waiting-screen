import { useEffect, useState, Fragment } from "react";
import { useAudioPlayer, type AudioPlayer } from 'react-use-audio-player';
import { useRouter } from "next/router";
import ms from "ms";

function getRandomIntInclusive(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
};

const waitTitle: string = "A special multi-platform broadcast, presented by ray"

const currentSceneNameAfterAwait: string = "🎮 VALORANT MAIN";

const promotionStartInBelowTime: number = ms("3m");

export default function Homepage() {
  const audioPlayer = useAudioPlayer();
  const router = useRouter();

  // in minutes
  const [isFinished, setFinishedState] = useState<boolean>(false);
  const [timerStarted, setTimerStartState] = useState<boolean>(false);
  const [initialTime, setInitialTime] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(0);
  
  // songs
  const [songs, setSongs] = useState<Record<"artist" | "title" | "raw", string>[]>([]);
  const [currentSong, setCurrentSong] = useState<Record<"artist" | "title", string> | null>(null);
  const [previousSongIndex, setPrevSongIndex] = useState<number | null>(null);
  const [isSongChanged, setSongChangeState] = useState<boolean>(false);

  // promotion videos
  const [promotionVideos, setPromotionVideos] = useState<string[]>([]);
  const [currentPromotionVideo, setCurrentPromotionVideo] = useState<string | null>(null);
  const [isPromotionPlayed, setPromotionPlayState] = useState<boolean>(false);
  const [isPromotionFinished, setPromotionFinishState] = useState<boolean>(false);

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
    const { artist, title, raw } = songs[getRandomSongIndex()];

    audioPlayer.load("/waiting_audios/" + encodeURI(raw), {
      onend: () => playSongs(),
      autoplay: true,
      initialVolume: 1
    });

    setCurrentSong({artist, title});

    return;
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
  };

  const playPromotionVideo = () => {
    const randomPromotionVideo = promotionVideos[getRandomIntInclusive(0, promotionVideos.length - 1)];

    setPromotionPlayState(true);
    setCurrentPromotionVideo(randomPromotionVideo);

    fadeAudio(audioPlayer, "out", 20);

    setTimeout(() => audioPlayer.pause(), ms("3s"));

    return;
  };

  const finishPromotionVideo = () => {
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

  // initial time check
  useEffect(() => {
    if (initialTime !== null) {
      // if the timeout is more than 10 minutes, the person who waits will be watching one of my videos :)
      if (initialTime >= promotionStartInBelowTime) {
        fetch("/api/promotion_videos", { method: "GET" })
        .then(x => x.json())
        .then(x => setPromotionVideos(x));
      };
    };
  }, [initialTime]);

  useEffect(() => {
    // time register
    setTimeout(() => {
      const timeWait = new URLSearchParams(router.asPath.split('?')[1])?.get("timewait");
      let numTimeWait = timeWait !== null ? ((isNaN(+timeWait) || +timeWait < 1) ? 2 : +timeWait) : 2;

      const initialTime = ms(`${numTimeWait}m`);
      setInitialTime(initialTime);
    
      setTimeout(() => setCurrentTime(initialTime), ms("1s"));
    }, 2000);

    // cleanup
    try {
      audioPlayer.cleanup();
    } catch {};

    // songs API
    fetch("/api/songs", { method: "GET" })
    .then(x => x.json())
    .then(x => setSongs(x));
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
    if (currentTime <= promotionStartInBelowTime && !isPromotionPlayed && promotionVideos.length > 0) {
      playPromotionVideo();
    };

    if (currentTime <= ms("10s") && isPromotionPlayed && !isPromotionFinished) {
      finishPromotionVideo();
    };
  }, [currentTime]);

  // if songs fetched successfully, play all of them
  useEffect(() => {
    if (songs.length > 0) {
      setTimeout(() => playSongs(), 1500);
    };
  }, [songs]);

  return (
    <Fragment>
      {/* promotion screen // ONLY OCCURS WHEN THE INITIAL TIME IS ABOVE 10 MINS */}
      <section className={"promotion"} data-active={!isPromotionFinished && currentPromotionVideo !== null}>
        <section className={"promotion-timer-container"}>
          <div className={"promotion-timer"}>
            <p>Starting in</p>
            <h1>{new Date(currentTime <= 0 ? 0 : currentTime).toISOString().slice(11, 19)}</h1>
          </div>
        </section>

        <section className={"promotion-video"}>
          {
            currentPromotionVideo !== null && (
              <video onEnded={finishPromotionVideo} controls={false} draggable={false} autoPlay={true} loop={false} muted={false} playsInline={true} disablePictureInPicture={true}>
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
            <div className={"nowplaying"} data-changed={currentTime >= ms("10s") && isSongChanged} data-disappear-if={currentTime <= ms("3s")} data-active={audioPlayer.paused === false || currentSong !== null}>
              <h6>Now playing</h6>
              <p>{currentSong?.artist} - {currentSong?.title?.split(".mp3")?.[0]?.replace(/\꞉/gim, ":")}</p>
            </div>
          </div>
        </section>

        {/* video */}
        <section className={"video"}>
          <video controls={false} draggable={false} autoPlay={true} loop={true} muted={true} playsInline={true} disablePictureInPicture={true}>
            <source src={`loading_room_screen_02.mp4?s=${Date.now()}#t=${getRandomIntInclusive(1, 14)}`} type="video/mp4"/>
          </video>
        </section>
      </section>
    </Fragment>
  );
};
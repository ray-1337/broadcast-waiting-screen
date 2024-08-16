import { useEffect, useState } from "react";
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

export default function Homepage() {
  const audioPlayer = useAudioPlayer();
  const router = useRouter();

  // in minutes
  const [isFinished, setFinishedState] = useState<boolean>(false);
  const [timerStarted, setTimerStartState] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  
  // songs
  const [songs, setSongs] = useState<Record<"artist" | "title" | "raw", string>[]>([]);
  const [currentSong, setCurrentSong] = useState<Record<"artist" | "title", string> | null>(null);
  const [previousSongIndex, setPrevSongIndex] = useState<number | null>(null);
  const [isSongChanged, setSongChangeState] = useState<boolean>(false);

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

  const fadeOutAudio = (player: AudioPlayer) => {
    let initialVolume = player.volume;
    const intervalTime = 50;

    const fade = setInterval(() => {
      initialVolume -= 0.01;
      player.setVolume(initialVolume);

      if (initialVolume <= 0) {
        clearInterval(fade);
        player.setVolume(0);
      };
    }, intervalTime);
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
    // time register
    setTimeout(() => {
      const timeWait = new URLSearchParams(router.asPath.split('?')[1])?.get("timewait");
      let numTimeWait = timeWait !== null ? ((isNaN(+timeWait) || +timeWait < 1) ? 2 : +timeWait) : 2;
    
      setTimeout(() => setCurrentTime(ms(`${numTimeWait}m`)), ms("1s"));
    }, 1000);

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
    if (currentTime <= ms("4s") && timerStarted === true) {
      fadeOutAudio(audioPlayer);

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

    if (currentTime > 0 && timerStarted !== true) {
      setTimerStartState(true);

      const interval = setInterval(() => {
        if (currentTime <= 0) {
          return clearInterval(interval);
        };

        return setCurrentTime((prev) => prev - 1000);
      }, ms("1s"));
    };
  }, [currentTime]);

  // if songs fetched successfully, play all of them
  useEffect(() => {
    if (songs.length > 0) {
      setTimeout(() => playSongs(), 1500);
    };
  }, [songs]);

  return (
    <section className={"frontpage"} data-finished={isFinished} data-started={currentSong !== null}>
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
  );
};
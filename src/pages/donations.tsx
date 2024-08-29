import { useState, useEffect, useRef } from "react";
import { useAudioPlayer } from 'react-use-audio-player';
import io from "socket.io-client";
import ms from "ms";

const socket = io("https://" + process.env.NEXT_PUBLIC_WS_ENDPOINT, {
  transports: ["websocket"],
  reconnectionDelay: ms("1s"),
  auth: {
    token: process.env.NEXT_PUBLIC_WS_KEY
  }
});

const donationShowTimeout = ms("7.5s");

export default function DonationPage() {
  const audioPlayer = useAudioPlayer();

  type DonationsProp = Record<"message" | "name", string> & { amount: number };

  const [donations, setDonations] = useState<DonationsProp[]>([]);
  const [showDonation, setShowDonation] = useState<boolean>(false);
  const recentDonation = useRef<DonationsProp | null>(null);

  // donations subscribe
  useEffect(() => {
    // load donations sfx
    audioPlayer.load("/sfx/donation_sfx_01.mp3", {
      autoplay: false,
      initialVolume: 0.5
    });

    // listen for incoming messages
    socket.on('new-donation', (donation) => {
      if (process.env.NODE_ENV === "development") {
        console.log("new donation", donation)
      };

      setDonations((prevDonations) => [...prevDonations, donation]);

      setShowDonation(true);
    });
  }, []);

  // donation show state
  useEffect(() => {
    if (showDonation === true) {
      if (donations.length <= 0) {
        setShowDonation(false);
      } else {
        audioPlayer.play();

        recentDonation.current = donations[0];
        
        setTimeout(() => setShowDonation(false), donationShowTimeout);
      };
    };

    if (showDonation === false && donations.length >= 1) {
      const previousDonations = donations.slice(1);
      setDonations(previousDonations);

      setTimeout(() => {
        setShowDonation(true);
        recentDonation.current = previousDonations[0];
      }, ms("1.5s"));
    };
  }, [showDonation]);

  return (
    <section className={"donations-body"}>
      <link rel="preload" href={"/unstabilized_css/donations.css"} as={"style"}/>
      <link rel="stylesheet" href={"/unstabilized_css/donations.css"} as={"style"}/>

      <section className={"donations-container"} data-active={showDonation}>
        <div className={"donations-reward"}>
          <p>A new donation from:</p>
          <h3>{recentDonation?.current?.name || "[USER]"}</h3>

          <div className={"donations-currency"}>
            <p>IDR</p>
            <h1>{(recentDonation?.current?.amount || 0).toLocaleString()}</h1>
          </div>
        </div>

        <div className={"donations-message"}>
          <p>{recentDonation?.current?.message || "[MSG]"}</p>
        </div>
      </section>
    </section>
  )
};
import React, { useEffect, useState } from "react";
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

const appId = "b2eb739d4bad46499b53405f047d34cd";
const token = "007eJxTYPCaUSr+0FaeceG76m0Hn54RWiFnWHNyX0Ko1EWVw0f+JLkqMJibJhmnmBukmhuapJgkppkmmpkZGFokmRhaGKQZplgmd0/nTG8IZGQQ+HaZiZEBAkF8foawzJTUfAXnxJwchZDU4hIGBgC8KyMd";
const channel = "Video Call Test";

const AgoraVideoCall: React.FC = () => {
    const [client, setClient] = useState<IAgoraRTCClient | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
    const [joined, setJoined] = useState<boolean>(false);
  
    const joinRoom = async () => {
      try {
        console.log("Initializing Agora client...");
        const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setClient(agoraClient);
  
        console.log("Joining channel...");
        await agoraClient.join(appId, channel, token, null);
        console.log("Successfully joined the channel");
  
        console.log("Creating local tracks (audio and video)...");
        const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalAudioTrack(microphoneTrack);
        setLocalVideoTrack(cameraTrack);
        console.log("Local tracks created successfully");
  
        console.log("Publishing local tracks...");
        await agoraClient.publish([microphoneTrack, cameraTrack]);
        console.log("Local tracks published");
  
        agoraClient.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType) => {
          try {
            console.log(`Remote user published: ${user.uid}, mediaType: ${mediaType}`);
            await agoraClient.subscribe(user, mediaType);
            console.log(`Subscribed to remote user ${user.uid}`);
  
            setRemoteUsers((prevUsers) => [...prevUsers, user]);
  
            if (mediaType === "video") {
              user.videoTrack?.play(`remote-player-${user.uid}`);
              console.log(`Playing remote video track for user: ${user.uid}`);
            }
  
            if (mediaType === "audio") {
              user.audioTrack?.play();
              console.log(`Playing remote audio track for user: ${user.uid}`);
            }
          } catch (error) {
            console.error(`Failed to subscribe to remote user: ${user.uid}`, error);
          }
        });
  
        agoraClient.on("user-unpublished", (user: IAgoraRTCRemoteUser) => {
          console.log(`Remote user unpublished: ${user.uid}`);
          setRemoteUsers((prevUsers) =>
            prevUsers.filter((remoteUser) => remoteUser.uid !== user.uid)
          );
        });
  
        setJoined(true); // Set state to indicate the user has joined the room
      } catch (error) {
        console.error("Error during Agora initialization", error);
      }
    };
  
    const leaveRoom = async () => {
      try {
        console.log("Leaving the room...");
        await client?.leave();
        localAudioTrack?.close();
        localVideoTrack?.close();
        setJoined(false);
        setRemoteUsers([]);
        console.log("Left the room successfully and closed local tracks");
      } catch (error) {
        console.error("Error while leaving the room", error);
      }
    };
  
    return (
      <div>
        {!joined ? (
          <button onClick={joinRoom}>Join Room</button>
        ) : (
          <button onClick={leaveRoom}>Leave Room</button>
        )}
  
        <div id="local-player" style={{ width: "640px", height: "480px" }}></div>
        {remoteUsers.map((user) => (
          <div key={user.uid} id={`remote-player-${user.uid}`} style={{ width: "640px", height: "480px" }}></div>
        ))}
      </div>
    );
  };
  
  export default AgoraVideoCall;
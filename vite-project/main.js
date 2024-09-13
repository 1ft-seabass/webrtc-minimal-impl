import Sora from "sora-js-sdk";

window.addEventListener('click', function () {
  // console.log('connect');
  // connect();
  document.querySelector('#video-el').play();
});

let connection;
const debug = true;
const signalingUrl = 'wss://sora2.uclab.jp/signaling';
const channelId = 'sora';
let recvonly;
let streams = {};

async function init(){

  console.log(`signalingUrl ${signalingUrl}`);
  console.log(`debug ${channelId}`);
  console.log(`signalingUrl ${debug}`);

  connection = Sora.connection(signalingUrl, debug);

  recvonly = connection.recvonly(channelId, {} , {});

  // ontrack イベント
  // メディアストリームトラック単位で発火する
  recvonly.on("track", onaddtrack.bind(this));

  // removetrack イベント (リモートメディアストリームが削除されたときに発生)
  recvonly.on("removetrack", onremovetrack.bind(this));

  await connect();
}

async function connect(){
  await recvonly.connect();
}

async function disconnect() {
  console.log('disconnect');
  // 切断
  await recvonly.disconnect();

  // リモートビデオを全て削除
  const remoteVideos = document.querySelector("#video-el");
  if (remoteVideos) {
    remoteVideos.innerHTML = "";
  }
}

function onaddtrack(event) {
  console.log('onaddtrack');
  // 追加されたストリームを取得
  // 注: Sora では 1 クライアント 1 音声/ 1 映像と決まっているため、
  // ストリームが複数入ってこない
  const remoteStream = event.streams[0];

  // リモートビデオエレメントを取得
  const remoteVideos = document.querySelector("#video-el");
  console.log('video-el');
  console.log(remoteVideos);

  remoteVideos.srcObject = remoteStream;

  // リモートビデオエレメントのIDを生成
  // const remoteVideoId = `remoteVideo-${remoteStream.id}`;

  /*

  // 既存のビデオエレメントが無ければ新たに作成
  if (!remoteVideos?.querySelector(`#${remoteVideoId}`)) {
    const remoteVideo = document.createElement("video");
    remoteVideo.id = remoteVideoId;
    remoteVideo.autoplay = true;
    remoteVideo.srcObject = remoteStream;
    remoteVideos?.appendChild(remoteVideo);
  }

  if (!streams[remoteStream.id]) {
    streams[remoteStream.id] = remoteStream;
  }
    */
}

function onremovetrack(event) {
  console.log('onremovetrack');
  console.log(event);

  // target は removetrack が発火した MediaStream
  const target = event.target;
  const remoteVideo = document.querySelector(`#remoteVideo-${target.id}`);
  const remoteVideos = document.querySelector("#remoteVideos");
  if (remoteVideo) {
    remoteVideos?.removeChild(remoteVideo);
  }

  if (this.streams[target.id]) {
    delete this.streams[target.id];
  }
}

init();
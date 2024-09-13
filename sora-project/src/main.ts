import Sora, {
  type SoraConnection,
  type ConnectionSubscriber,
} from "sora-js-sdk";

class SoraClient {
  private debug = true;

  private signalingUrl: string;
  private channelId: string;
  private accessToken: string;

  private connection: SoraConnection;
  private recvonly: ConnectionSubscriber;

  private streams: Record<string, MediaStream> = {};

  constructor(signalingUrl: string, channelId: string, accessToken: string) {
    this.signalingUrl = signalingUrl;
    this.channelId = channelId;
    this.accessToken = accessToken;

    // 接続先の Sora を設定する
    this.connection = Sora.connection(this.signalingUrl, this.debug);
    const metadata = {
      // Sora では特に "access_token" と決まっているわけではありません
      // access_token は Sora Labo や Sora Cloud の想定です
      access_token: this.accessToken,
    };
    const options = {};
    this.recvonly = this.connection.recvonly(this.channelId, metadata , options);

    // ontrack イベント
    // メディアストリームトラック単位で発火する
    this.recvonly.on("track", this.onaddtrack.bind(this));

    // removetrack イベント (リモートメディアストリームが削除されたときに発生)
    this.recvonly.on("removetrack", this.onremovetrack.bind(this));
  }

  async connect() {
    console.log('connect');
    // 接続
    await this.recvonly.connect();
  }

  async disconnect() {
    console.log('disconnect');
    // 切断
    await this.recvonly.disconnect();

    // リモートビデオを全て削除
    const remoteVideos = document.querySelector("#remoteVideos");
    if (remoteVideos) {
      remoteVideos.innerHTML = "";
    }
  }

  getStats(): Promise<RTCStatsReport | null> {
    if (!this.recvonly.pc) {
      return Promise.resolve(null);
    }    

    return this.recvonly.pc.getStats();
  }

  private onaddtrack(event: RTCTrackEvent) {
    console.log('onaddtrack');
    // 追加されたストリームを取得
    // 注: Sora では 1 クライアント 1 音声/ 1 映像と決まっているため、
    // ストリームが複数入ってこない
    const remoteStream = event.streams[0];

    // リモートビデオエレメントを取得
    const remoteVideos = document.querySelector("#remoteVideos");
    console.log('remoteVideos');
    console.log(remoteVideos);

    // リモートビデオエレメントのIDを生成
    const remoteVideoId = `remoteVideo-${remoteStream.id}`;

    // 既存のビデオエレメントが無ければ新たに作成
    if (!remoteVideos?.querySelector(`#${remoteVideoId}`)) {
      const remoteVideo = document.createElement("video");
      remoteVideo.id = remoteVideoId;
      remoteVideo.autoplay = true;
      remoteVideo.srcObject = remoteStream;
      remoteVideos?.appendChild(remoteVideo);
    }

    if (!this.streams[remoteStream.id]) {
      this.streams[remoteStream.id] = remoteStream;
    }
  }

  private onremovetrack(event: MediaStreamTrackEvent) {
    console.log('onremovetrack');
    console.log(event);

    // target は removetrack が発火した MediaStream
    const target = event.target as MediaStream;
    const remoteVideo = document.querySelector(`#remoteVideo-${target.id}`);
    const remoteVideos = document.querySelector("#remoteVideos");
    if (remoteVideo) {
      remoteVideos?.removeChild(remoteVideo);
    }

    if (this.streams[target.id]) {
      delete this.streams[target.id];
    }
  }

  get getStreams(): Record<string, MediaStream> {
    return this.streams;
  }
}

// DOMContentLoaded イベントは、ページ全体が読み込まれ、DOMが準備できたときに発生する
// これを利用して、必要な DOM 要素が利用可能になったタイミングで addEventListener を呼び出している
// ページ読み込み後にボタンにクリックイベントリスナーが追加され、ボタンがクリックされると connect 関数が実行される
document.addEventListener("DOMContentLoaded", (_event) => {
  // Vite を利用して env.local から取得
  const SIGNALING_URL = 'wss://sora2.uclab.jp/signaling';
  const CHANNEL_ID = 'sora';
  const ACCESS_TOKEN = 'sora';

  const soraClient = new SoraClient(SIGNALING_URL, CHANNEL_ID, ACCESS_TOKEN);
  document
    .querySelector("#connect")
    ?.addEventListener("click", () => soraClient.connect());
  document
    .querySelector("#disconnect")
    ?.addEventListener("click", () => soraClient.disconnect());
});
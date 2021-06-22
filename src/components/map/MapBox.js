import React, { Component } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import RecordTrigger from "./RecordTrigger";
import drawTrack from "../../lib/DrawTrack";
import addTrackLayer from "../../lib/AddTrackLayer";
import decodeTrack from "../../lib/DecodeTrack";
import encodeTrack from "../../lib/EncodeTrack";
import showTrackLayer from "../../lib/ShowTrackLayer";
import hideTrackLayer from "../../lib/HideTrackLayer";
import hideAllTracks from "../../lib/HideAllTracks";
import showAllTracks from "../../lib/ShowAllTracks";
import isValidPosition from "../../lib/IsValidPosition";
import calcDistance from "../../lib/CalcDistance";
import axios from "axios";
import { withStyles } from '@material-ui/core/styles';

// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;
// アクセストークン
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_API_KEY;
const RAILS_API_ENDPOINT = process.env.REACT_APP_BACKEND_API_ENDPOINT;

const geolocate = new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true, // 高精度な位置情報取得
  },
  trackUserLocation: true, // ユーザの位置情報追跡
});

const styles = theme => ({
  root: {
    width: "100%",
    height: "89vh",
  }
});

class MapBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isStarted: false,
      current_pos: {
        lng: 0,
        lat: 0,
      },
    };
    this.map = "";
    this.track = [];
    this.previous_position = undefined;
    //watchPositionの実行idを管理
    this.watch_id = -1;
    this.distance = 0;

    this.onClick = this.onClick.bind(this);
    this.setMap = this.setMap.bind(this);
    this.beginRecordTrack = this.beginRecordTrack.bind(this);
    this.endRecordTrack = this.endRecordTrack.bind(this);
    this.initializePosition = this.initializePosition.bind(this);
    this.onPosition = this.onPosition.bind(this);
  }

  beginRecordTrack() {
    this.track = [];
    this.distance = 0;
    hideAllTracks(this.map, this.props.tracks.length);
    showTrackLayer(this.map, "current_track");
    //初期化
    navigator.geolocation.getCurrentPosition(this.initializePosition);
    this.watch_id = navigator.geolocation.watchPosition(this.onPosition);
  }

  endRecordTrack(track) {
    navigator.geolocation.clearWatch(this.watch_id);
    hideTrackLayer(this.map, "current_track");

    if (this.distance >= 50) {
      let new_tracks = this.props.tracks;
      new_tracks.push(track);
      addTrackLayer(this.map, "track_" + String(new_tracks.length - 1), track); //NOTE: track_layerに用いているidは0スタートなので,全トラック数-1を常に用いる
      this.props.handleTracksChange(new_tracks);
      this.postTrack(track);

      alert("distance: " + this.distance);
    } else {
      alert("not saved distance(<50): " + this.distance);
    }
    showAllTracks(this.map, this.props.tracks.length);
  }

  initializePosition(position) {
    this.previous_position = position;
    this.track.push([position.coords.longitude, position.coords.latitude]);
    this.map.flyTo({
      center: [position.coords.longitude, position.coords.latitude],
      zoom: 15,
    });
  }

  onPosition(position) {
    if (isValidPosition(this.previous_position, position)) {
      this.distance += calcDistance(this.previous_position, position);
      this.track.push([position.coords.longitude, position.coords.latitude]);
      this.previous_position = position;
    }
    drawTrack(this.map, "current_track", this.track);
  }

  getAllTracks(user_id) {
    const url = RAILS_API_ENDPOINT + "/users_tracks/" + user_id;
    axios
      .get(url)
      .then((results) => {
        let data = results.data;
        let tracks = [];

        for (let i = 0; i < data.length; i++) {
          tracks.push(decodeTrack(data[i].data));
          console.log(tracks[i]);
          addTrackLayer(this.map, "track_" + String(i), tracks[i]);
        }

        this.props.handleTracksChange(tracks);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  // PostTrack
  postTrack(data) {
    const encoded_data = encodeTrack(data);
    let body = {
      track: {
        data: encoded_data,
        user_id: this.props.current_user.id,
      },
    };

    const url = RAILS_API_ENDPOINT + "/tracks";
    axios
      .post(url, body)
      .then((results) => {
        const data = results.data;
      })
      .catch((error) => {
        console.log(error);
      });
  }

  onClick() {
    let isStarted = this.state.isStarted;
    if (isStarted) {
      // Recordの処理
      this.endRecordTrack(this.track);
    } else {
      // Start時の処理
      this.beginRecordTrack();
    }
    this.setState({ isStarted: !isStarted });
  }

  setMap(position) {
    const c_lng = position.coords.longitude;
    const c_lat = position.coords.latitude;
    // 現在地設定
    this.setState({
      current_pos: {
        lng: c_lng,
        lat: c_lat,
      },
    });
    let map = new mapboxgl.Map({
      container: this.mapContainer,
      center: [c_lng, c_lat],
      style: "mapbox://styles/mapbox/dark-v9", // mapのスタイル指定
      zoom: 12,
    });

    this.props.handleMapCreate(map);
    this.map = map;

    this.map.addControl(geolocate);
    this.map.on(
      "load",
      function () {
        this.getAllTracks(this.props.current_user.id);

        // 記録用のレイヤーの追加
        addTrackLayer(this.map, "current_track");

        //Next, Prev用のレイヤーの追加
        addTrackLayer(this.map, "single_track");
      }.bind(this)
    );
  }

  componentDidMount() {
    navigator.geolocation.getCurrentPosition(this.setMap);
  }

  componentWillUnmount() {
    try {
      this.map.remove();
    } catch (e) {
      console.log(e);
    }
  }

  render() {
    const onClick = this.onClick;
    const { classes } = this.props;
    return (
      <div className={ classes.root } ref={(e) => (this.mapContainer = e)}>
        <RecordTrigger onClick={onClick} />
      </div>
    );
  }
}

export default withStyles(styles, { withTheme: true })(MapBox);

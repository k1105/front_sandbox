import { useState, useEffect } from "react";
import { Header } from "./header";
import { Menu } from "./menu";
import { MapBox } from "./components/map/MapBox";
import { UserForm } from "./components/user/App";
import "./App.css";

const styles = {
  root: {
    overflow: "hidden",
  },
  text: {
    position: "absolute",
    top: "calc(50% + 17vh)",
    width: "100vw",
    textAlign: "center",
    margin: "auto",
    color: "white",
  },
};

export const App = () => {
  const [currentUser, setCurrentUser] = useState([
    {
      id: "",
      name: "",
    },
  ]);
  const [currentLocation, setCurrentLocation] = useState();
  const [trackNum, setTrackNum] = useState(0);
  const [tracks, setTracks] = useState([]);
  const [map, setMap] = useState();

  const [isLoggedIn, setIsLoggedIn] = useState();

  useEffect(() => {
    if (currentUser.id) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [currentUser.id]);

  return (
    <div className={styles.root}>
      {isLoggedIn ? (
        <div>
          <div style={styles.text}>
            <div className="bg-wrap">
              <span className="slide-in">YAMAGATA</span>
            </div>
          </div>
          <div className="inset">
            <Header currentLocation={currentLocation} />
            <MapBox
              currentUser={currentUser}
              tracks={tracks}
              trackNum={trackNum}
              map={map}
              setCurrentLocation={setCurrentLocation}
              setTracks={setTracks}
              setTrackNum={setTrackNum}
              setMap={setMap}
            />
            <Menu
              currentUser={currentUser}
              map={map}
              tracks={tracks}
              trackNum={trackNum}
            />
          </div>
        </div>
      ) : (
        <UserForm setCurrentUser={setCurrentUser} />
      )}
    </div>
  );
};

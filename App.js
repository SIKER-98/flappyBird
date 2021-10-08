import React, { Component } from "react";
import { Dimensions, StyleSheet, Text, View, StatusBar, Alert, TouchableOpacity, Image } from "react-native";
import Matter from "matter-js";
import { GameEngine } from "react-native-game-engine";
import Bird from "./Bird";
import Floor from "./Floor";
import Physics, { resetPipes } from "./Physics";
import Constants from "./Constants";
import Images from "./assets/Images";
import findCoordinates from "./Geolocation";
import Realm from "realm";
import axios from "axios";

let realm;

const scoreRow = {
  name: "score",
  properties: {
    score: "int",
    address: "string",
    date: "string",
  },
};


export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      running: true,
      score: 0,
      location: "",
      scores: [],
      played: 0,
    };

    this.gameEngine = null;

    realm = new Realm({
      path: "scoreDb.realm",
      schema: [{
        name: "highScore",
        properties: {
          point: "int",
          address: "string",
          date: "string",
        },
      }],
    });

    this.entities = this.setupWorld();

    const updater = ({ location }) => {
      this.setState({ location });
    };
    findCoordinates(updater);
  }

  // pobieranie z bazy danych
  getFromDb = async () => {
    // let highScores = realm.objects("highScore");
    // console.log("top:", highScores);
    //
    // this.setState({played:highScores.length})
    //
    // highScores = [...highScores].sort((a, b) => b.point - a.point).slice(0, 8);
    //
    // console.log("top 10:", highScores);
    // this.setState({ scores: highScores });
    await axios.get("http://localhost:4545/api/")
      .then(res => {
        console.log(res);
        this.setState({ played: res.data.length });

        const highScores = [...res.data].sort((a, b) => b.point - a.point).slice(0, 8);
        this.setState({ scores: highScores });
      });

  };

  // zapis wyniku do bazy danych
  insertToDb = async (record) => {
    // console.log(record);
    // realm.write(() => {
    //   realm.create("highScore", {
    //     point: record.point * 1,
    //     address: record.address,
    //     date: record.date,
    //   });
    // });
    await axios.post("http://localhost:4545/api/", {
      time: record.date,
      location: record.location,
      point: record.point,
    }).then(r => {
      console.log(r);
    });
  };


  setupWorld = () => {
    const updater = ({ location }) => {
      this.setState({ location });
    };

    findCoordinates(updater);

    let engine = Matter.Engine.create({ enableSleeping: false });
    let world = engine.world;
    world.gravity.y = 0.0;

    let bird = Matter.Bodies.rectangle(Constants.MAX_WIDTH / 2, Constants.MAX_HEIGHT / 2, Constants.BIRD_WIDTH, Constants.BIRD_HEIGHT);

    let floor1 = Matter.Bodies.rectangle(
      Constants.MAX_WIDTH / 2,
      Constants.MAX_HEIGHT - 70,
      Constants.MAX_WIDTH + 4,
      50,
      { isStatic: true },
    );

    let floor2 = Matter.Bodies.rectangle(
      Constants.MAX_WIDTH + (Constants.MAX_WIDTH / 2),
      Constants.MAX_HEIGHT - 25,
      Constants.MAX_WIDTH + 4,
      50,
      { isStatic: true },
    );


    Matter.World.add(world, [bird, floor1, floor2]);
    Matter.Events.on(engine, "collisionStart", (event) => {
      var pairs = event.pairs;

      this.gameEngine.dispatch({ type: "game-over" });

    });

    return {
      physics: { engine: engine, world: world },
      floor1: { body: floor1, renderer: Floor },
      floor2: { body: floor2, renderer: Floor },
      bird: { body: bird, pose: 1, renderer: Bird },
    };
  };

  onEvent = (e) => {
    if (e.type === "game-over") {
      //Alert.alert("Game Over");

      this.insertToDb({
        point: this.state.score,
        location: this.state.location,
        time: new Date().toJSON(),
      });

      this.getFromDb();

      this.setState({
        running: false,
      });
    } else if (e.type === "score") {
      this.setState({
        score: this.state.score + 1,
      });
    }
  };

  reset = () => {
    resetPipes();
    this.gameEngine.swap(this.setupWorld());
    this.setState({
      running: true,
      score: 0,
    });
  };

  render() {
    return (
      <View style={styles.container}>
        <Image source={Images.background} style={styles.backgroundImage} resizeMode="stretch" />
        <GameEngine
          ref={(ref) => {
            this.gameEngine = ref;
          }}
          style={styles.gameContainer}
          systems={[Physics]}
          running={this.state.running}
          onEvent={this.onEvent}
          entities={this.entities}>
          <StatusBar hidden={true} />
        </GameEngine>
        {/*<Text style={styles.location}>{this.state.location}</Text>*/}
        <Text style={styles.score}>{this.state.score}</Text>

        {!this.state.running && <TouchableOpacity style={styles.fullScreenButton} onPress={this.reset}>
          <View style={styles.fullScreen}>
            <Text style={styles.gameOverText}>Game Over</Text>
            <Text style={styles.gameOverSubText}>Try Again</Text>
            <Text style={styles.gameOverSubText}>Played: {this.state.played} times</Text>

            <Text style={styles.gameOverText}>High Scores:</Text>
            {this.state.scores.map((score, i) => (
              <>
                <Text key={i} style={{
                  color: "white",
                  marginTop: 12,
                }}
                >{i + 1}) {score.point}pkt. - {score.location}</Text>
                <Text key={"0" + i} style={{
                  color: "white",
                }}

                >{score.time.replace("T", " ").replace("Z", "").slice(0, 19)}</Text>
              </>
            ))}
          </View>
        </TouchableOpacity>}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  location: {
    position: "absolute",
    color: "white",
    fontSize: 30,
    bottom: 25,
    left: 10,
    textShadowColor: "#444444",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
    fontFamily: "04b_19",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: Constants.MAX_WIDTH,
    height: Constants.MAX_HEIGHT,
  },
  gameContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  gameOverText: {
    color: "white",
    fontSize: 48,
    fontFamily: "04b_19",
  },
  gameOverSubText: {
    color: "white",
    fontSize: 24,
    fontFamily: "04b_19",
  },
  fullScreen: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "black",
    opacity: 0.8,
    justifyContent: "center",
    alignItems: "center",
  },
  score: {
    position: "absolute",
    color: "white",
    fontSize: 72,
    top: 50,
    left: Constants.MAX_WIDTH / 2 - 20,
    textShadowColor: "#444444",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
    fontFamily: "04b_19",
  },
  fullScreenButton: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flex: 1,
  },
});

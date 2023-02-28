import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:8888');

function App() {
  const [username, setUsername] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [round, setRound] = useState(1);
  const [balls, setBalls] = useState(Array(9).fill('red'));
  const [greenBallIndex, setGreenBallIndex] = useState(-1);
  const [waiting, setWaitng] = useState(false);
  const [intervalMessage, setIntervalMessage] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState();

  useEffect(() => {
    // Listen for game started event
    socket.on('game-started', ({ username: userName, round: gameRound }) => {
      localStorage.setItem('username', userName);
      setGameStarted(true);
      setRound(gameRound);
      setScore(0);
      setTime(0);
      startRound(gameRound);
    });
    // Listen for round ended event
    socket.on('round-ended', ({ player, round: gameRound }) => {
      const userName = localStorage.getItem('username');
      if (player.username === userName) {
        setScore(player.score);
        setTime(player.time);
      }

      if (gameRound < 5) {
        setRound(gameRound);
        startRound(gameRound);
      } else {
        setWinnerMessage(player);
      }
    });
    socket.on('game-ended', (player) => {
      setWinnerMessage(player);
    });
    // Listen for green ball index event
    socket.on('green-ball-index', (index) => {
      setGreenBallIndex(index);
    });
    socket.on(`waitingforplayer`, (data) => {
      setWaitng(data.waiting);
    });
  }, [socket]);

  const startGame = () => {
    socket.emit('join-game', username);
  };

  const startRound = ({ round: gameRound }) => {
    console.log('Heelo from Start Round');
    setIntervalMessage(true);
    setGreenBallIndex(Math.floor(Math.random() * 9));
    setBalls((balls) => {
      return balls.map((color, index) => {
        return index === greenBallIndex ? 'green' : 'red';
      });
    });
    setTimeout(() => {
      socket.emit('round-started', { gameRound });
      setIntervalMessage(false);
    }, 3000);
  };

  const handleBallClick = (index) => {
    localStorage.setItem(`username`, username);
    if (index === greenBallIndex) {
      socket.emit('green-ball-clicked', {
        username,
        time: Date.now() - (round === 1 ? 0 : time),
      });
    }
  };
  const average =
    winnerMessage?.player?.alltime.reduce((a, b) => a + b, 0) /
    winnerMessage?.player?.alltime.length;

  let IMAGE_BASE_URL = 'https://demo.speedsize.com/task/ballgame';
  return (
    <div className="App">
      <React.Fragment>
        {!winnerMessage ? (
          <React.Fragment>
            {intervalMessage ? (
              <h1>Get Ready For The Next Battle</h1>
            ) : (
              <React.Fragment>
                {waiting ? (
                  <div>
                    <h1>Waiting For the Second Player</h1>
                  </div>
                ) : (
                  <React.Fragment>
                    {!gameStarted && (
                      <div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                        <button onClick={startGame}>Start Game</button>
                      </div>
                    )}

                    {gameStarted && (
                      <div>
                        <h2>Round {round}</h2>
                        <div className="board">
                          {balls.map((color, index) => (
                            <img
                              className="ball"
                              onClick={() => handleBallClick(index)}
                              src={
                                index === greenBallIndex
                                  ? `${IMAGE_BASE_URL}/green-ball.avif`
                                  : `${IMAGE_BASE_URL}/red-ball.avif`
                              }
                            ></img>
                            // <div
                            //   key={index}
                            //   className={`ball ${
                            //     index === greenBallIndex ? "" : "red-ball"
                            //   }`}
                            //   onClick={() => handleBallClick(index)}
                            // />
                          ))}
                        </div>
                        <div>
                          Score: {score} Time: {time / 1000}s
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                )}
              </React.Fragment>
            )}
          </React.Fragment>
        ) : (
          <React.Fragment>
            <h1>Winner: {winnerMessage?.player?.username}</h1>
            <p>Average Response Time: {average / 1000}s</p>
          </React.Fragment>
        )}
      </React.Fragment>
    </div>
  );
}

export default App;

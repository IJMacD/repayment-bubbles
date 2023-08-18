import { FormEvent, useEffect, useState } from 'react'
import './App.css'
import { parseCSV } from './csv';
import { Pledge, PledgeStatus, parsePledges } from './pledges';
import { PledgeStatsTable } from './PledgeStatsTable';
import { PledgeBubbles } from './PledgeBubbles';
import { ProjectTable } from './ProjectTable';
import { ColourMode } from './ColourMode';

function App() {
  const [ pledges, setPledges ] = useState([] as Pledge[]);
  const [ now, setNow ] = useState(Date.now());
  const [ isPlaying, setIsPlaying ] = useState(false);
  const [ isLooping, setIsLooping ] = useState(false);
  const [ colourMode, setColourMode ] = useState(ColourMode.Overdue);

  async function handleFile (e: FormEvent<HTMLInputElement>) {
    if (e.currentTarget.files?.length) {
      const file = e.currentTarget.files[0];
      e.currentTarget.value = "";
      const text = await file.text();
      const lines = parseCSV(text);
      const pledges = parsePledges(lines);
      setPledges(pledges);
    }
  }

  const earliestStart = Math.min(...pledges.map(p => +p.startDate));
  const latestStart = Math.max(...pledges.map(p => +p.startDate));

  const [ speed, setSpeed ] = useState(1);

  useEffect(() => {
    const delta = 100;

    if (isPlaying) {
      const cb = () => {
        setNow(now => {
          const newVal = now + 86400 * speed * delta;

          if (isLooping && newVal > latestStart) {
            return earliestStart;
          }

          return newVal;
        });
      }

      const id = setInterval(cb, delta);

      return () => clearInterval(id);
    }
  }, [isPlaying, isLooping, speed]);

  // const livePledges = pledges.filter(p => p.status === PledgeStatus.live);
  // const completedPledges = pledges.filter(p => p.status === PledgeStatus.completed);
  // const pendingPledges = pledges.filter(p => p.status === PledgeStatus.pending);
  // const unknownPledges = pledges.filter(p => p.status === PledgeStatus.unknown);

  // const earliestStart = Math.min(...livePledges.map(p => +p.startDate));
  // const latestStart = Math.max(...livePledges.map(p => +p.startDate));


  // const overduePledges = livePledges.filter(p => +p.endDate < now);
  const realNow = Date.now();

  const startedPledges = pledges.filter(p => +p.startDate < now);

  const livePledges = startedPledges.filter(p => +p.endDate > now);
  const completedPledges = startedPledges.filter(p => +p.endDate < now && p.status === PledgeStatus.completed);
  const overduePledges = startedPledges.filter(p => +p.endDate < now && p.status === PledgeStatus.live);
  const futureLatePledges = startedPledges.filter(p => p.status === PledgeStatus.live && +p.endDate < realNow);

  // const pendingPledges = pledges.filter(p => +p.startDate > now);
  const liveRealPledges = pledges.filter(p => +p.endDate > realNow);
  const completedRealPledges = pledges.filter(p => +p.endDate < realNow && p.status === PledgeStatus.completed);
  const overdueRealPledges = pledges.filter(p => +p.endDate < realNow && p.status === PledgeStatus.live);

  const projects = new Set(pledges.map(p => p.projectName));
  const liveProjects = new Set(livePledges.map(p => p.projectName));
  const overdueProjects = new Set(overduePledges.map(p => p.projectName));

  const statsRowsAll = [
    { label: "Pledges", pledges },
    // { label: "Unknown Pledges", pledges: unknownPledges },
    { label: "Completed Pledges", pledges: completedRealPledges },
    { label: "Live Pledges", pledges: liveRealPledges },
    { label: "Overdue Pledges", pledges: overdueRealPledges },
  ];

  const statsRowsCurrent = [
    { label: "Pledges", pledges: startedPledges },
    { label: "Completed Pledges", pledges: completedPledges },
    { label: "Live Pledges", pledges: livePledges },
    { label: "Overdue Pledges", pledges: overduePledges },
    { label: "Will Be Overdue", pledges: futureLatePledges },
    // { label: "Pending Pledges", pledges: pendingPledges },
  ];

  const pendingAmount = sumPledges(completedPledges) - sumPledges(livePledges) - sumPledges(overduePledges);

  const interestReceived = completedPledges.reduce((total, pledge) => total + pledge.expectedInterest, 0);

  // const interestRealReceived = completedRealPledges.reduce((total, pledge) => total + pledge.expectedInterest, 0);

  const currencyFormatter = new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" });

  const projectsOverdue = [...projects].filter(projectName => {
    const projectPledges = pledges.filter(p => p.projectName === projectName);
    const startedPledges = projectPledges.filter(p => +p.startDate < now);
    return startedPledges.some(p => (+p.endDate < now) && p.status === PledgeStatus.live);
  });

  const ONE_YEAR = 365.25 * 86400 * 1000;

  return (
    <>
      <div style={{display:"flex"}}>
        <div style={{width:320}}>
          <input type="file" onChange={handleFile} />
          <h2>All Time</h2>
          <PledgeStatsTable rows={statsRowsAll} />
          {/* <p>Received Interest: {currencyFormatter.format(interestRealReceived)}</p> */}
          <p>Unique Projects: {projects.size}</p>
          <h2>Colour Mode</h2>
          <label>
            <input type="radio" name="colourMode" value={ColourMode.Solid} checked={colourMode === ColourMode.Solid} onChange={() => setColourMode(ColourMode.Solid)} />
            Solid
          </label>
          <label>
            <input type="radio" name="colourMode" value={ColourMode.Overdue} checked={colourMode === ColourMode.Overdue} onChange={() => setColourMode(ColourMode.Overdue)} />
            Overdue
          </label>
          <label>
            <input type="radio" name="colourMode" value={ColourMode.Interest} checked={colourMode === ColourMode.Interest} onChange={() => setColourMode(ColourMode.Interest)} />
            Interest
          </label>
          <label>
            <input type="radio" name="colourMode" value={ColourMode.Name} checked={colourMode === ColourMode.Name} onChange={() => setColourMode(ColourMode.Name)} />
            Name
          </label>
          <label>
            <input type="radio" name="colourMode" value={ColourMode.Age} checked={colourMode === ColourMode.Age} onChange={() => setColourMode(ColourMode.Age)} />
            Age
          </label>
          <label>
            <input type="radio" name="colourMode" value={ColourMode.Repaid} checked={colourMode === ColourMode.Repaid} onChange={() => setColourMode(ColourMode.Repaid)} />
            Repaid
          </label>
          <h2>Animation</h2>
          <button onClick={() => setIsPlaying(p => !p)}>{isPlaying?"Pause":"Play"}</button><br/>
          <button onClick={() => setNow(earliestStart)}>Earliest</button>
          <button onClick={() => setNow(now => now - ONE_YEAR)}>- One Year</button>
          <button onClick={() => setNow(Date.now())}>Now</button>
          <label style={{display:"block"}}>Loop: <input type="checkbox" checked={isLooping} onChange={e => setIsLooping(e.target.checked)} /></label>
          <label style={{display:"block"}}>
            Speed:{' '}
            <input type="range" value={speed} min={0} max={10} onChange={e => setSpeed(e.target.valueAsNumber)} />
          </label>
          <p>Now: {new Date(now).toISOString().substring(0,10)}</p>
          {/* <p>Latest Start: {new Date(latestStart).toDateString()}</p> */}
          <PledgeStatsTable rows={statsRowsCurrent} />
          <p>Received Interest: {currencyFormatter.format(interestReceived)}</p>
          <p>Unique Projects: {liveProjects.size}</p>
          {/* <p>{[...liveProjects.values()].join(";")}</p> */}
          <p>Projects Overdue: {((projectsOverdue.length/projects.size)*100).toFixed(0)}%</p>
          <p>Overdue: {[...overdueProjects.values()].join("; ")}</p>
        </div>
        <div style={{flex: 1}}>
          <PledgeBubbles pledges={startedPledges} pendingTotal={pendingAmount} now={now} colourMode={colourMode} />
        </div>
      </div>
      <ProjectTable pledges={pledges} now={now} />
    </>
  )
}

export default App

function sumPledges (pledges: Pledge[]) {
  return pledges.reduce((total, pledge) => total + pledge.amount, 0);
}
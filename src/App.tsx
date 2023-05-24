import { FormEvent, useEffect, useState } from 'react'
import './App.css'
import { parseCSV } from './csv';
import { Pledge, PledgeStatus, parsePledges } from './pledges';
import { PledgeStatsTable } from './PledgeStatsTable';
import { PledgeBubbles } from './PledgeBubbles';
import { ProjectTable } from './ProjectTable';

function App() {
  const [ pledges, setPledges ] = useState([] as Pledge[]);
  const [ now, setNow ] = useState(Date.now());
  const [ isPlaying, setIsPlaying ] = useState(false);
  const [ isLooping, setIsLooping ] = useState(false);

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

  useEffect(() => {
    const delta = 100;
    const scale = 86400;

    if (isPlaying) {
      const cb = () => {
        setNow(now => {
          const newVal = now + scale * delta;

          if (isLooping && newVal > latestStart) {
            return earliestStart;
          }

          return newVal;
        });
      }

      const id = setInterval(cb, delta);

      return () => clearInterval(id);
    }
  }, [isPlaying, isLooping]);

  // const livePledges = pledges.filter(p => p.status === PledgeStatus.live);
  // const completedPledges = pledges.filter(p => p.status === PledgeStatus.completed);
  // const pendingPledges = pledges.filter(p => p.status === PledgeStatus.pending);
  // const unknownPledges = pledges.filter(p => p.status === PledgeStatus.unknown);

  // const earliestStart = Math.min(...livePledges.map(p => +p.startDate));
  // const latestStart = Math.max(...livePledges.map(p => +p.startDate));


  // const overduePledges = livePledges.filter(p => +p.endDate < now);

  const startedPledges = pledges.filter(p => +p.startDate < now);

  const livePledges = startedPledges.filter(p => +p.endDate > now);
  const completedPledges = startedPledges.filter(p => +p.endDate < now && p.status === PledgeStatus.completed);
  const overduePledges = startedPledges.filter(p => +p.endDate < now && p.status === PledgeStatus.live);

  // const pendingPledges = pledges.filter(p => +p.startDate > now);

  const projects = new Set(pledges.map(p => p.projectName));
  const liveProjects = new Set(livePledges.map(p => p.projectName));
  const overdueProjects = new Set(overduePledges.map(p => p.projectName));

  const statsRowsAll = [
    { label: "Pledges", pledges },
    // { label: "Unknown Pledges", pledges: unknownPledges },
  ];

  const statsRowsCurrent = [
    { label: "Pledges", pledges: startedPledges },
    { label: "Completed Pledges", pledges: completedPledges },
    { label: "Live Pledges", pledges: livePledges },
    { label: "Overdue Pledges", pledges: overduePledges },
    // { label: "Pending Pledges", pledges: pendingPledges },
  ];

  const pendingAmount = sumPledges(completedPledges) - sumPledges(livePledges) - sumPledges(overduePledges);

  const interestReceived = completedPledges.reduce((total, pledge) => total + pledge.expectedInterest, 0);

  const currencyFormatter = new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" });

  const projectsOverdue = [...projects].filter(projectName => {
    const projectPledges = pledges.filter(p => p.projectName === projectName);
    const startedPledges = projectPledges.filter(p => +p.startDate < now);
    return startedPledges.some(p => (+p.endDate < now) && p.status === PledgeStatus.live);
  });

  return (
    <>
      <div style={{display:"flex"}}>
        <div style={{width:320}}>
          <input type="file" onChange={handleFile} />
          <h2>All Time</h2>
          <PledgeStatsTable rows={statsRowsAll} />
          <p>Unique Projects: {projects.size}</p>
          <h2>Animation</h2>
          <button onClick={() => setIsPlaying(p => !p)}>{isPlaying?"Pause":"Play"}</button>
          <button onClick={() => setNow(earliestStart)}>Reset</button>
          <label>Loop: <input type="checkbox" checked={isLooping} onChange={e => setIsLooping(e.target.checked)} /></label>
          <p>Now: {new Date(now).toDateString()}</p>
          {/* <p>Latest Start: {new Date(latestStart).toDateString()}</p> */}
          <PledgeStatsTable rows={statsRowsCurrent} />
          <p>Received Interest: {currencyFormatter.format(interestReceived)}</p>
          <p>Unique Projects: {liveProjects.size}</p>
          {/* <p>{[...liveProjects.values()].join(";")}</p> */}
          <p>Projects Overdue: {((projectsOverdue.length/projects.size)*100).toFixed(0)}%</p>
          <p>Overdue: {[...overdueProjects.values()].join("; ")}</p>
        </div>
        <div style={{flex: 1}}>
          <PledgeBubbles pledges={livePledges} overdueTotal={sumPledges(overduePledges)} pendingTotal={pendingAmount} now={now} isPrescient />
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
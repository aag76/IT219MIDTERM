import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';

const UFCHeatmap = ({ csvFile }) => {
  const [fightersData, setFightersData] = useState([]);
  const [selectedFighter, setSelectedFighter] = useState('');
  const [fightersList, setFightersList] = useState([]);
  const [fighterYears, setFighterYears] = useState({});

  useEffect(() => {
    const fetchCSV = async () => {
      const data = await d3.csv(csvFile);
      const fighterStats = {};
      const fighterYearsData = {};

      data.forEach((fight) => {
        const fighter1 = fight["Fighter 1"];
        const winner = fight.Winner;
        const year = fight.Date.split('-')[0];

        if (!fighterStats[fighter1]) {
          fighterStats[fighter1] = {
            Fighter: fighter1,
            Total_Fights: 0,
            Total_Wins: 0,
            Total_Strikes_Thrown: 0,
            Total_Takedowns_Attempted: 0,
            Total_Submissions_Attempted: 0,
          };
          fighterYearsData[fighter1] = { earliest: year, latest: year };
        }

        fighterStats[fighter1].Total_Fights += 1;
        if (fighter1 === winner) fighterStats[fighter1].Total_Wins += 1;

        fighterStats[fighter1].Total_Strikes_Thrown += +fight["Fighter_1_STR"] || 0;
        fighterStats[fighter1].Total_Takedowns_Attempted += +fight["Fighter_1_TD"] || 0;
        fighterStats[fighter1].Total_Submissions_Attempted += +fight["Fighter_1_SUB"] || 0;

        if (year < fighterYearsData[fighter1].earliest) {
          fighterYearsData[fighter1].earliest = year;
        }
        if (year > fighterYearsData[fighter1].latest) {
          fighterYearsData[fighter1].latest = year;
        }
      });

      const processedData = Object.values(fighterStats).map(fighter => ({
        Fighter: fighter.Fighter,
        Avg_Strikes_Thrown: fighter.Total_Strikes_Thrown / fighter.Total_Fights,
        Avg_Takedowns_Attempted: fighter.Total_Takedowns_Attempted / fighter.Total_Fights,
        Avg_Submissions_Attempted: fighter.Total_Submissions_Attempted / fighter.Total_Fights,
        Total_Wins: fighter.Total_Wins,
      }));

      setFightersData(processedData);
      setFightersList(processedData.map(f => f.Fighter).sort());
      setFighterYears(fighterYearsData);
    };

    fetchCSV();
  }, [csvFile]);

  const filteredData = selectedFighter 
    ? fightersData.filter(fighter => fighter.Fighter === selectedFighter)
    : fightersData;

  useEffect(() => {
    if (filteredData.length === 0) return;

    const fighterCount = filteredData.length;
    const cellWidth = 150; 
    const totalWidth = Math.max(1200, fighterCount * cellWidth);
    const totalHeight = 700;

    const svg = d3.select("#heatmap")
      .attr("width", totalWidth)
      .attr("height", totalHeight);
    svg.selectAll("*").remove();

    const metrics = ['Avg_Strikes_Thrown', 'Avg_Takedowns_Attempted', 'Avg_Submissions_Attempted', 'Total_Wins'];

    const heatmapData = filteredData.flatMap(fighter => metrics.map(metric => ({
      fighter: fighter.Fighter,
      metric,
      value: fighter[metric] || 0
    })));

    const xScale = d3.scaleBand()
      .domain(filteredData.map(d => d.Fighter))
      .range([0, totalWidth])
      .padding(0.1);

    const yScale = d3.scaleBand()
      .domain(metrics)
      .range([0, 600])
      .padding(0.1);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(heatmapData, d => d.value)]);

    svg.selectAll("rect")
      .data(heatmapData)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.fighter))
      .attr("y", d => yScale(d.metric))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => colorScale(d.value));

    svg.selectAll("text")
      .data(heatmapData)
      .enter()
      .append("text")
      .attr("x", d => xScale(d.fighter) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.metric) + yScale.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("dy", "-.5em")
      .attr("fill", "black")
      .attr("font-size", "10px")
      .text(d => {

        const metricName = d.metric.replace('Avg_', '').replace('_', ' ');
        const formattedValue = metricName === 'Takedowns Attempted' 
          ? d.value.toFixed(2) 
          : d.value.toFixed(1);
        return `${formattedValue} (${metricName})`;
      });

    svg.append("g")
      .attr("transform", `translate(0, 600)`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .text(d => d.replace('Avg_', '').replace('_', ' '));

  }, [filteredData]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-4">UFC Fighter Performance Heatmap</h2>
        <div className="flex items-center">
          <label className="mr-2 font-semibold">Select Fighter:</label>
          <select 
            value={selectedFighter} 
            onChange={(e) => setSelectedFighter(e.target.value)}
            className="px-2 py-1 border rounded w-64"
          >
            <option value="" className="font-bold">All Fighters (Complete Dataset)</option>
            {fightersList.map(fighter => (
              <option key={fighter} value={fighter}>
                {fighter} ({fighterYears[fighter]?.earliest} - {fighterYears[fighter]?.latest})
              </option>
            ))}
          </select>
        </div>
        
        {selectedFighter && (
          <p className="font-bold mb-2">
            {selectedFighter} (Active Years: {fighterYears[selectedFighter]?.earliest} - {fighterYears[selectedFighter]?.latest})
          </p>
        )}
      </div>
      
      <div className="flex-grow overflow-hidden">
        <div className="h-full overflow-auto">
          <svg id="heatmap" className="w-full"></svg>
        </div>
      </div>
    </div>
  );
};

export default UFCHeatmap;
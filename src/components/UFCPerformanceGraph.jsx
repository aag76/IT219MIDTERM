import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

const UFCPerformanceGraph = ({ csvFile }) => {
  const [data, setData] = useState([]);
  const [processedData, setProcessedData] = useState({});
  const chartRef = useRef(null);

  useEffect(() => {
    d3.csv(csvFile).then((loadedData) => {
      const parsedData = loadedData.map(d => ({
        Date: d.Date,
        Fighter_1_STR: +d.Fighter_1_STR,
        Fighter_2_STR: +d.Fighter_2_STR,
        Fighter_1_TD: +d.Fighter_1_TD,
        Fighter_2_TD: +d.Fighter_2_TD,
        Fighter_1_SUB: +d.Fighter_1_SUB,
        Fighter_2_SUB: +d.Fighter_2_SUB,
        Method: d.Method
      }));
      setData(parsedData);
    });
  }, [csvFile]);

  useEffect(() => {
    if (data.length === 0) return;

    const groupedData = {};
    const fightCountByYear = {};
    
    data.forEach(fight => {
      const year = new Date(fight.Date).getFullYear();
      fightCountByYear[year] = (fightCountByYear[year] || 0) + 1;
    });
    
    data.forEach(fight => {
      const year = new Date(fight.Date).getFullYear();
      const period = Math.floor(year / 5) * 5;
      
      if (!groupedData[period]) {
        groupedData[period] = {};
      }

      if (!groupedData[period][year]) {
        groupedData[period][year] = { 
          year, 
          strikes: 0, 
          takedowns: 0, 
          submissions: 0, 
          ko_tko: 0, 
          sub_wins: 0, 
          decision_wins: 0,
          fightCount: fightCountByYear[year] || 0
        };
      }
      
      groupedData[period][year].strikes += (fight.Fighter_1_STR + fight.Fighter_2_STR);
      groupedData[period][year].takedowns += (fight.Fighter_1_TD + fight.Fighter_2_TD);
      groupedData[period][year].submissions += (fight.Fighter_1_SUB + fight.Fighter_2_SUB);
      
      if (fight.Method.includes("KO") || fight.Method.includes("TKO")) {
        groupedData[period][year].ko_tko += 1;
      } else if (fight.Method.includes("SUB")) {
        groupedData[period][year].sub_wins += 1;
      } else if (fight.Method.includes("DEC")) {
        groupedData[period][year].decision_wins += 1;
      }
    });
    
    Object.keys(groupedData).forEach(period => {
      Object.keys(groupedData[period]).forEach(year => {
        const yearData = groupedData[period][year];
        const fightCount = yearData.fightCount;
        
        if (fightCount > 0) {
          yearData.strikes = +(yearData.strikes / fightCount).toFixed(2);
          yearData.takedowns = +(yearData.takedowns / fightCount).toFixed(2);
          yearData.submissions = +(yearData.submissions / fightCount).toFixed(2);
          
          yearData.ko_tko = +((yearData.ko_tko / fightCount) * 100).toFixed(2);
          yearData.sub_wins = +((yearData.sub_wins / fightCount) * 100).toFixed(2);
          yearData.decision_wins = +((yearData.decision_wins / fightCount) * 100).toFixed(2);
        }
      });
      
      groupedData[period] = Object.values(groupedData[period]).sort((a, b) => a.year - b.year);
    });

    setProcessedData(groupedData);
  }, [data]);

  useEffect(() => {
    if (Object.keys(processedData).length === 0) return;
    
    d3.select(chartRef.current).selectAll("svg").remove();
    
    Object.keys(processedData).forEach(period => {
      const dataset = processedData[period];
      const width = 600, height = 400, margin = { top: 40, right: 120, bottom: 60, left: 60 };
      const svg = d3.select(chartRef.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height);
      
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`UFC Performance Trends (${period}-${+period + 4})`);
      
      const x = d3.scaleBand()
        .domain(dataset.map(d => d.year))
        .range([margin.left, width - margin.right])
        .padding(0.1);
      
      const yCountScale = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => Math.max(d.strikes, d.takedowns, d.submissions)) * 1.1])
        .nice()
        .range([height - margin.bottom, margin.top]);
      
      const yPercentScale = d3.scaleLinear()
        .domain([0, 100]) 
        .nice()
        .range([height - margin.bottom, margin.top]);
      
      const line = (key, usePercentScale) => d3.line()
        .x(d => x(d.year) + x.bandwidth() / 2)
        .y(d => usePercentScale ? yPercentScale(d[key]) : yCountScale(d[key]))
        .curve(d3.curveMonotoneX);
      
      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
      
      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yCountScale))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text("Avg per Fight");
      
      svg.append("g")
        .attr("transform", `translate(${width - margin.right},0)`)
        .call(d3.axisRight(yPercentScale).tickFormat(d => d + "%"))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.right - 20)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text("Finish Rate %");
      
      const metrics = [
        { key: "strikes", label: "Avg Strikes", color: "#8884d8", usePercentScale: false },
        { key: "takedowns", label: "Avg Takedowns", color: "#82ca9d", usePercentScale: false },
        { key: "submissions", label: "Avg Submission Attempts", color: "#ff7300", usePercentScale: false },
        { key: "ko_tko", label: "KO/TKO %", color: "#ff0000", usePercentScale: true },
        { key: "sub_wins", label: "Submission Win %", color: "#00aa00", usePercentScale: true },
        { key: "decision_wins", label: "Decision Win %", color: "#0066ff", usePercentScale: true }
      ];
      
      metrics.forEach(metric => {
        svg.append("path")
          .datum(dataset)
          .attr("fill", "none")
          .attr("stroke", metric.color)
          .attr("stroke-width", 2)
          .attr("d", line(metric.key, metric.usePercentScale));
          
        svg.selectAll(`dot-${metric.key}`)
          .data(dataset)
          .enter()
          .append("circle")
          .attr("cx", d => x(d.year) + x.bandwidth() / 2)
          .attr("cy", d => metric.usePercentScale ? yPercentScale(d[metric.key]) : yCountScale(d[metric.key]))
          .attr("r", 4)
          .attr("fill", metric.color);
      });
      
      const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);
      
      metrics.forEach((metric, i) => {
        const legendRow = legend.append("g")
          .attr("transform", `translate(0, ${i * 20})`);
        
        legendRow.append("rect")
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", metric.color);
        
        legendRow.append("text")
          .attr("x", 15)
          .attr("y", 10)
          .text(metric.label)
          .style("font-size", "12px");
      });
    });
  }, [processedData]);

  return (
    <div>
      <h2>UFC Performance Trends by Period (Average Stats)</h2>
      <div ref={chartRef}></div>
    </div>
  );
};

export default UFCPerformanceGraph;
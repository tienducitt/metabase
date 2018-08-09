/* @flow */

import React, { Component } from "react";
import { t } from "c-3po";
import d3 from "d3";
import cx from "classnames";

import Scalar from "./Scalar";

import colors from "metabase/lib/colors";
import { formatValue } from "metabase/lib/formatting";

import ChartSettingGaugeSegments from "metabase/visualizations/components/settings/ChartSettingGaugeSegments";

import type { VisualizationProps } from "metabase/meta/types/Visualization";

const OUTER_RADIUS = 45; // within 100px canvas
const INNER_RADIUS_RATIO = 4 / 5;
const INNER_RADIUS = OUTER_RADIUS * INNER_RADIUS_RATIO;

export default class Gauge extends Component {
  props: VisualizationProps;

  static uiName = t`Gauge`;
  static identifier = "gauge";
  static iconName = "number";

  static minSize = { width: 3, height: 3 };

  static isSensible(cols, rows) {
    return rows.length === 1 && cols.length === 1;
  }

  static checkRenderable([{ data: { cols, rows } }]) {
    // scalar can always be rendered, nothing needed here
  }

  static settings = {
    "gauge.segments": {
      section: "Display",
      title: t`Segments`,
      default: [
        { value: 0, color: colors["success"] },
        { value: 33, color: colors["warning"] },
        { value: 66, color: colors["error"] },
        { value: 100, color: colors["text-medium"] },
      ],
      widget: ChartSettingGaugeSegments,
    },
  };

  render() {
    const {
      series: [{ data: { rows, cols } }],
      settings,
      className,
      width,
      height,
    } = this.props;

    let svgWidth, svgHeight;
    if (height / width < 0.5) {
      svgHeight = height;
      svgWidth = height * 2;
    } else {
      svgWidth = width;
      svgHeight = width / 2;
    }

    const segments = settings["gauge.segments"];

    const arc = d3.svg
      .arc()
      .outerRadius(OUTER_RADIUS)
      .innerRadius(OUTER_RADIUS * INNER_RADIUS_RATIO);

    const angle = d3.scale
      .linear()
      .domain([segments[0].value, segments[segments.length - 1].value])
      .range([-Math.PI / 2, Math.PI / 2]);

    const value = rows[0][0];
    const column = cols[0];

    const valuePosition = (value, distance) => {
      const a = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angle(value)));
      return [
        Math.cos(a - Math.PI / 2) * distance,
        Math.sin(a - Math.PI / 2) * distance,
      ];
    };

    const radiusCenter = OUTER_RADIUS - (OUTER_RADIUS - INNER_RADIUS) / 2;

    const textStyle = {
      fill: colors["text-dark"],
      fontSize: "0.15em",
    };

    return (
      <div className={cx(className, "flex layout-centered")}>
        <div
          className="relative"
          style={{ width: svgWidth, height: svgHeight }}
        >
          <Scalar {...this.props} className="spread" style={{ top: "33%" }} />
          {/* slightly more than 50 height to account for labels */}
          <svg viewBox="0 0 100 55">
            <g transform={`translate(50,50)`}>
              {/* ARC SEGMENTS */}
              {segments.slice(0, -1).map((segment, index) => (
                <path
                  d={arc({
                    startAngle: angle(segments[index].value),
                    endAngle: angle(segments[index + 1].value),
                  })}
                  fill={segment.color}
                />
              ))}
              {/* NEEDLE */}
              <path
                d={
                  `M${valuePosition(value, INNER_RADIUS).join(" ")} ` +
                  `L${valuePosition(value, OUTER_RADIUS).join(" ")} `
                }
                strokeWidth={1.5}
                strokeLinecap="round"
                stroke={colors["text-medium"]}
              />
              {/* START LABEL */}
              <text
                x={-radiusCenter}
                y={2.5}
                style={{
                  ...textStyle,
                  textAnchor: "middle",
                }}
              >
                {formatValue(segments[0].value, { column })}
              </text>
              {/* END LABEL */}
              <text
                x={radiusCenter}
                y={2.5}
                style={{
                  ...textStyle,
                  textAnchor: "middle",
                }}
              >
                {formatValue(segments[segments.length - 1].value, { column })}
              </text>
              {/* SEGMENT LABELS */}
              {segments.slice(1, -1).map((segment, index) => {
                const pos = valuePosition(segment.value, OUTER_RADIUS * 1.01);
                return (
                  <text
                    x={pos[0]}
                    y={pos[1]}
                    style={{
                      ...textStyle,
                      textAnchor:
                        Math.abs(pos[0]) < 5
                          ? "middle"
                          : pos[0] > 0 ? "start" : "end",
                    }}
                  >
                    {formatValue(segment.value, { column })}
                  </text>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    );
  }
}

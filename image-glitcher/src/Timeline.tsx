import React from 'react';
import { State, Frame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM from 'react-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Util } from './Util';
import { FrameHolder } from './FrameHolder';

interface TimelineProps
{
    keyframes : Frame[]
}

export class Timeline extends React.Component<TimelineProps>
{
    render()
    {
        let containerStyle : React.CSSProperties = 
        {
            margin: "16px",
            padding: "16px",
            verticalAlign: "top",
            background: Colors.background,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: Colors.border,
        };

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Timeline</h1>
                {this.props.keyframes.map((keyframe, key) => <FrameHolder frame={keyframe} frameIndex={key} />)}
            </div>
        );
    }
}

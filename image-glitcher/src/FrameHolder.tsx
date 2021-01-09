import React from 'react';
import { State, KeyFrame } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';
import ReactDOM from 'react-dom';
import { Button } from '@material-ui/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Util } from './Util';
import ArrowExpand from './icons/arrow-expand.svg';
import { Icon } from './Icon';

interface FrameHolderProps
{
    frame : KeyFrame,
    frameIndex : number,
    context : "framebank" | "timeline"
}

interface FrameHolderState
{
    hover : boolean
}

export class FrameHolder extends React.Component<FrameHolderProps, FrameHolderState>
{
    state = { hover: false };

    render()
    {
        let containerStyle : React.CSSProperties = 
        {
            verticalAlign: "top",
            display: "inline-block",
            position: "relative",
            height: 240 //from Styles
        };

        let overlayContainerStyle : React.CSSProperties = 
        {
            color: Colors.white,
            background: Colors.transBlack,
            display: this.state.hover ? "block" : "none",
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            padding: "16px",
            boxSizing: "border-box"
        };

        let iconSize = "32px";
        let iconStyle : React.CSSProperties = 
        {
            width: iconSize,
            height: iconSize
        };

        let ampModSettingStyle : React.CSSProperties = 
        {
            margin: 0,
            color: "#ed1b24"
        };

        let delaySettingStyle : React.CSSProperties = 
        {
            margin: 0,
            color: "#3cec97"
        };

        //img element has className downloadImg to make it easier to find later



        return (
            <div style={containerStyle} onMouseEnter={() => this.mouseEnter()} onMouseLeave={() => this.mouseLeave()}>
                <img className="downloadImg" src={this.props.frame.url} style={Styles.imageStyle}></img>
                <div style={overlayContainerStyle}>
                    <a href={this.props.frame.url} target="_blank"><Icon iconName={'arrow-expand'}/></a>
                    <a href={this.props.frame.url} download={Util.getFrameName(this.props.frameIndex)}><Icon iconName={'download'}/></a>
                    <a onClick={() => State.inspectFrame(this.props.frame)} style={Styles.handCursor}><Icon iconName={'pencil'}/></a>
                    {this.props.context == "framebank" ? <a onClick={() => State.addKeyFrame(this.props.frame)} style={Styles.handCursor}><Icon iconName={'key-plus'}/></a> : ""}
                    {this.props.context == "timeline" ? <a onClick={() => State.deleteKeyFrame(this.props.frame)} style={Styles.handCursor}><Icon iconName={'key-remove'}/></a> : ""}
                    {Object.keys(this.props.frame.settings.ampModSettings).map((settingName, key) => {
                        let settingValue = Object.values(this.props.frame.settings.ampModSettings)[key];
                        return(
                            <p key={key} style={ampModSettingStyle}>{settingName}: {settingValue}</p>
                        );
                    })}
                    {Object.keys(this.props.frame.settings.delaySettings).map((settingName, key) => {
                        let settingValue = Object.values(this.props.frame.settings.delaySettings)[key];
                        return(
                            <p key={key} style={delaySettingStyle}>{settingName}: {settingValue}</p>
                        );
                    })}
                </div>
            </div>
        );
    }

    mouseEnter()
    {
        this.setState({ hover: true });
    }

    mouseLeave()
    {
        this.setState({ hover: false });
    }
}

import React from 'react';
import { Colors } from './Colors';
import { Styles } from './Styles';

interface AnimationPreviewProps
{
    url : string,
    isLoading : boolean,
    animationLength : number
}

export class AnimationPreview extends React.Component<AnimationPreviewProps>
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
            display: "inline-block"
        };

        let downloadButton = this.props.isLoading || this.props.url == "" ? null : <a href={this.props.url} target="_blank">Download</a>;
        let imagePreview = this.props.isLoading ? "Loading animation..." : <img style={Styles.bigImageStyle} src={this.props.url}/>;

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Animation</h1>
                <p>Frames: {this.props.animationLength}</p>
                {imagePreview}
                {downloadButton}
            </div>
        );
    }
}
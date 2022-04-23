import { Card } from 'material-ui';
import React from 'react';
import { Colors } from './Colors';
import { Styles } from './Styles';

interface AnimationPreviewProps
{
    url : string,
    isLoading : boolean,
    animationLength : number
}

export class AnimationPreviewWindow extends React.Component<AnimationPreviewProps>
{
    render()
    {
        let downloadButton = this.props.isLoading || this.props.url == "" ? null : <a href={this.props.url} target="_blank">Download</a>;
        let imagePreview = this.props.isLoading ? "Loading animation..." : <img style={Styles.bigImageStyle} src={this.props.url}/>;

        return (
            <Card style={Styles.containerStyle}>
                <h1 style={Styles.h1Style}>Animation</h1>
                <p style={Styles.leftMargin}>Frames: {this.props.animationLength}</p>
                {imagePreview}
                {downloadButton}
            </Card>
        );
    }
}
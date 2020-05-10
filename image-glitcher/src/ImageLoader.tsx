import React from 'react';
import { State } from './App';
import { Colors } from './Colors';
import { Styles } from './Styles';

export class ImageLoader extends React.Component
{
    state = { previewUrl: "" };

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

        let innerContainerStyle : React.CSSProperties = 
        {
            paddingBottom: "16px"
        };

        return (
            <div style={containerStyle}>
                <h1 style={Styles.h1Style}>Load Image</h1>
                <p>.bmp files only</p>
                <div style={innerContainerStyle}>
                    <input ref="fileInput" type="file" id="files" name="file" onChange={() => this.loadImage()}/>
                </div>
                <img src={this.state.previewUrl} style={Styles.imageStyle}/>
            </div>
        );
    }

    loadImage()
    {
        let fileInput = this.refs.fileInput as HTMLInputElement;
        let imageFile = fileInput.files![0];
        
        let fileReader = new FileReader();
        fileReader.readAsArrayBuffer(imageFile);

        fileReader.onloadend = () =>
        {
            //get data from file
            let result = fileReader.result as ArrayBuffer;
            let rawData = new Uint8Array(result);
            State.setImageData(rawData);

            //put preview in component
            fileReader.readAsDataURL(imageFile);

            fileReader.onloadend = () =>
            {
                this.setState({previewUrl: fileReader.result});
            }
        }
    }
}

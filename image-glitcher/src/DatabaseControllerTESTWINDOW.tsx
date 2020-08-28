import React from 'react';
import { Colors } from './Colors';
import { DatabaseController } from './DatabaseController';

export class DatabaseControllerTESTWINDOW extends React.Component
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

        return (
            <div style={containerStyle}>
                <button onClick={async () => await this.test()}>TEST</button>
            </div>
        );
    }

    async test()
    {
        await DatabaseController.init();
    }
}

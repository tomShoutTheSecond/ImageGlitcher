export class AudioProcessor
{
    audioContext = new AudioContext();

    async decodeFile(file : File)
    {
        return new Promise<AudioBuffer>((resolve, reject) => 
        {
            var reader1 = new FileReader();
            reader1.onload = ev =>
            {
                // Decode audio
                this.audioContext.decodeAudioData(ev!.target!.result as ArrayBuffer).then(buffer => 
                {
                    //var soundSource = this.audioContext.createBufferSource();
                    //soundSource.buffer = buffer;

                    resolve(buffer);
                });
            };
    
            reader1.readAsArrayBuffer(file);
        });
    }

    processBuffer(buffer : AudioBuffer, smoothingValue : number)
    {
        let leftSamples = buffer.getChannelData(0);

        //make lowpass buffer larger for more smoothing
        let lowpassBuffer = [];
        for (let i = 0; i < smoothingValue; i++) 
        {
            lowpassBuffer.push(0);
        }

        let outputBuffer = [];

        for (let i = 0; i < leftSamples.length; i++) 
        {
            let sample = leftSamples[i];

            let sampleSquared = sample * sample;

            //add sample to lowpass buffer
            lowpassBuffer.unshift(sampleSquared);

            //remove oldest sample from lowpass buffer
            lowpassBuffer.pop();

            //apply lowpass processing to sample
            let sampleSquaredLowpassed = this.averageOfArray(lowpassBuffer);
            let sampleLowpassed = Math.sqrt(sampleSquaredLowpassed);

            outputBuffer.push(sampleLowpassed);
        }

        return outputBuffer;
    }

    averageOfArray(array : number[])
    {
        let sum = 0;
        for (let i = 0; i < array.length; i++ )
        {
            sum += array[i]; //don't forget to add the base
        }
        
        return sum / array.length;
    }
}
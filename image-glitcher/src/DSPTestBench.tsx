import { saveAs } from 'file-saver';

export class DSPTestBench
{
    downloadUrl : string = "";

    processAudioBuffer(buffer : AudioBuffer, settings : any) //settings is AmpModSettings
    {
        let leftSamples = buffer.getChannelData(0);
        let rightSamples = buffer.getChannelData(1);

        let leftSamplesProcessed = this.bufferProcess(leftSamples, settings);
        let rightSamplesProcessed = this.bufferProcess(rightSamples, settings);

        return this.saveAsWavFile(leftSamplesProcessed, rightSamplesProcessed);
    }

    private bufferProcess(samples : Float32Array, settings : AmpModSettings)
    {
        let processedBuffer = [];
        for (let i = 0; i < samples.length; i++) 
        {
            const sample = samples[i];

            let angle = settings.phase + i * settings.frequency;
            let coef = settings.offset + Math.sin(angle) * settings.amp;

            let processedSample = sample * coef;
            processedBuffer.push(processedSample);
        }

        return new Float32Array(processedBuffer);
    }

    private saveAsWavFile(left : Float32Array, right : Float32Array)
    {
        //interleaved
        const interleaved = new Float32Array(left.length + right.length)
        for (let src=0, dst=0; src < left.length; src++, dst+=2) 
        {
            interleaved[dst] =   left[src]
            interleaved[dst+1] = right[src]
        }

        // get WAV file bytes and audio params of your audio source
        const wavBytes = this.getWavBytes(interleaved.buffer, 
        {
            isFloat: true,       // floating point or 16-bit integer
            numChannels: 2,
            sampleRate: 44100,
        });

        const wav = new Blob([wavBytes], { type: 'audio/wav' });

        if(this.downloadUrl != "")
            URL.revokeObjectURL(this.downloadUrl);
        this.downloadUrl = URL.createObjectURL(wav);

        return this.downloadUrl;
    }

    //returns Uint8Array of WAV bytes
    getWavBytes(buffer : ArrayBufferLike, options : any) 
    {
        const type = options.isFloat ? Float32Array : Uint16Array
        const numFrames = buffer.byteLength / type.BYTES_PER_ELEMENT
    
        const headerBytes = this.getWavHeader(Object.assign({}, options, { numFrames }))
        const wavBytes = new Uint8Array(headerBytes.length + buffer.byteLength);
    
        // prepend header, then add pcmBytes
        wavBytes.set(headerBytes, 0)
        wavBytes.set(new Uint8Array(buffer), headerBytes.length)
    
        return wavBytes
    }
  
    // adapted from https://gist.github.com/also/900023
    // returns Uint8Array of WAV header bytes
    getWavHeader(options : any) 
    {
        const numFrames =      options.numFrames
        const numChannels =    options.numChannels || 2
        const sampleRate =     options.sampleRate || 44100
        const bytesPerSample = options.isFloat? 4 : 2
        const format =         options.isFloat? 3 : 1
    
        const blockAlign = numChannels * bytesPerSample
        const byteRate = sampleRate * blockAlign
        const dataSize = numFrames * blockAlign
    
        const buffer = new ArrayBuffer(44)
        const dv = new DataView(buffer)
    
        let p = 0
    
        function writeString(s : string) 
        {
            for (let i = 0; i < s.length; i++) 
            {
                dv.setUint8(p + i, s.charCodeAt(i))
            }
            p += s.length
        }
    
        function writeUint32(d : number) 
        {
            dv.setUint32(p, d, true)
            p += 4
        }
    
        function writeUint16(d : number) 
        {
            dv.setUint16(p, d, true)
            p += 2
        }
    
        writeString('RIFF')              // ChunkID
        writeUint32(dataSize + 36)       // ChunkSize
        writeString('WAVE')              // Format
        writeString('fmt ')              // Subchunk1ID
        writeUint32(16)                  // Subchunk1Size
        writeUint16(format)              // AudioFormat
        writeUint16(numChannels)         // NumChannels
        writeUint32(sampleRate)          // SampleRate
        writeUint32(byteRate)            // ByteRate
        writeUint16(blockAlign)          // BlockAlign
        writeUint16(bytesPerSample * 8)  // BitsPerSample
        writeString('data')              // Subchunk2ID
        writeUint32(dataSize)            // Subchunk2Size
    
        return new Uint8Array(buffer)
    }
}
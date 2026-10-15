import {Config} from '@remotion/cli/config';

// MP4 H.264, 1080x1920, 30 fps (tamanho e fps vêm da composição)
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setCrf(18);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
// Permite usar um Chrome já instalado: REMOTION_BROWSER_EXECUTABLE=/caminho/do/chrome
if (process.env.REMOTION_BROWSER_EXECUTABLE) Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);

import React, { RefObject, useEffect, useState } from 'react';
import shaka from 'shaka-player';

function VideoPlayer () {
  const [videoComponent] = useState(React.createRef() as RefObject<HTMLVideoElement>);

  useEffect(() => {
    var manifestUri = 'https://d3ezbh7ttypwmz.cloudfront.net/560ffd76-9dc5-495d-b030-7e855c3de517/dash/manifest.mpd';

	const video = videoComponent.current as HTMLMediaElement;

	var player = new shaka.Player(video);

	player.getNetworkingEngine()?.registerRequestFilter(function(type, request) {
		if (type === shaka.net.NetworkingEngine.RequestType.MANIFEST ||
		type === shaka.net.NetworkingEngine.RequestType.SEGMENT) {
			request.uris[0] += "?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9kM2V6Ymg3dHR5cHdtei5jbG91ZGZyb250Lm5ldC81NjBmZmQ3Ni05ZGM1LTQ5NWQtYjAzMC03ZTg1NWMzZGU1MTcvKiIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTY4MDg5MDk0Mn19fV19&Key-Pair-Id=K4TSNEKDNQM66&Signature=b0OLLnpdQ6eAVzmKkcWDP6w68REfLXiJbBsCsX-07V1gao4KXKmSiHh05s0m1ZQyXUhdk8cS6lthLsXRCEmN6Av8xBFu7yZvUO0iKuukFLIincg-pzGQCd3lN7l48hyiI9-iKLMdAGAoIypLR2TSysE3iGY0VgunniKzi8~qo3TOzSydjh8arcgkDnNcaT~PT1f97qyrpMqFczBp34sq8hzlv8yeDy~Mxn3vUnOKp6zZdmW3wp~dL-yoHDHEId62jV9sQoSIrLYB4jYDO0XDs2yK0VmdyPhc1AYXkknhj5xeS3CekP3CDlCE0m5gDlj0~c9RGvDh~jIQbJWdyXTBpQ__"
		}
	});

  	// Try to load a manifest.
	// This is an asynchronous process.
	player.load(manifestUri);              
  }, []);
	
  return (
	<video
	  style={{width: '100vw', height: '100vh', objectFit: 'cover', maxWidth: '100%', maxHeight: '100%'}}
	  ref={videoComponent}
	  poster="//shaka-player-demo.appspot.com/assets/poster.jpg"
	  controls />
  );
}

export default VideoPlayer;

import { useRouter } from 'next/router';
import React, { RefObject, useEffect, useState } from 'react';
import shaka from 'shaka-player';
import axios from 'axios';

function VideoPlayer () {
  const [videoComponent] = useState(React.createRef() as RefObject<HTMLVideoElement>);

  const router = useRouter();
  useEffect(() => {
	console.log(JSON.stringify(router.asPath));
	console.log(JSON.stringify(router.query));
	axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/getMovieMetadataForPlayer/${router.query.movieId}`)
	.then((x) => {

		var manifestUri = x.data.mpdFile;

		const video = videoComponent.current as HTMLMediaElement;

		var player = new shaka.Player(video);

		player.getNetworkingEngine()?.registerRequestFilter(function(type, request) {
			if (type === shaka.net.NetworkingEngine.RequestType.MANIFEST ||
			type === shaka.net.NetworkingEngine.RequestType.SEGMENT) {
				request.uris[0] += `?${x.data.cloudFrontSignedUrlParams}`;
			}
		});

		// Try to load a manifest.
		// This is an asynchronous process.
		player.load(manifestUri);
	})           
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

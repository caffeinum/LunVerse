import { sceneEvents } from "../Events/EventsCenter";

const IPFS_GATEWAY = 'https://buildship.mypinata.cloud/ipfs/';

export async function getPlayerNFT(moralis) {
    const playerAddress1 = '0xeac41D05531770b85ad1E0f145b94BFE205bDa78';
    const playerAddress2 = '0xffE06cb4807917bd79382981f23d16A70C102c3B';
    const result = await moralis.Web3.getNFTs({ chain: 'eth', address: playerAddress2 });

    const pageResults = [];
    let currentPage;

    sceneEvents.on('getNFTsFromPage', async (page) => {
        currentPage = page;

        if (page <= pageResults.length) {
            sceneEvents.emit('getNFTsFromPageResult', pageResults[page - 1]);
            return;
        }

        let index = 0;

        const metadatas = result.map(async (r) => {
            index++;

            const isPage = (page - 1) * 12 <= index && index < page * 12

            if (isPage) {
                // if (r.metadata) {
                //     const m = JSON.parse(r.metadata)

                //     if (m.image) {
                //         return { image: fixImageURL(m.image), name: m.name };
                //     }
                // }

                const { token_address, token_id } = r

                const token = await moralis.Web3API.token.getTokenIdMetadata({ chain: 'eth', address: token_address, token_id });

                console.log('r', r)
                console.log('token', token)

                const { metadata } = token

                if (metadata) {
                    const m = JSON.parse(metadata)

                    if (m.image) {
                        return { image: fixImageURL(m.image), name: m.name };
                    }
                }

                console.log('wrong metadata', token.name, token.token_uri, metadata);

                // if (!r.token_uri) {
                //     // TODO: return "not loaded" image object
                //     return
                // }

                // try {
                //     return getMetadata(r.token_uri);
                // }  catch (err) {
                //     console.log('Error with', r.token_uri, err);
                // }
            }
        })

        const r = await Promise.all(metadatas);

        const pageResult = r.filter(data => data != null);

        if (currentPage > pageResults.length) {
            pageResults.push(pageResult);
        }

        sceneEvents.emit('getNFTsFromPageResult', pageResult);
    });

    sceneEvents.emit('makeNFTsPanel', result.length);
}


function fixURL(url) {
    if (url.startsWith("ipfs")) {
        const [, hash] = url.split("ipfs://ipfs/");
        return IPFS_GATEWAY + hash;
    }
    else {
        return url;
    }
}
function fixImageURL(url) {
    if (url.startsWith("ipfs")) {
        const [ , hash ] = url.split("ipfs://");
        return IPFS_GATEWAY + hash;
    } else {
        return url;
    }
}

const getMetadata = async (uri) => {
    let url = fixURL(uri);

    // if url is data:application/json; fetch right away
    // if not, proxy via /metadata?uri=
    let data
    if (url.startsWith("data:application/json")) {
        data = await fetch(url).then(r => r.json());
    } else if (false) {
        data = await moralis.Web3.getMetadata({ chain: 'eth', uri: url });
    } else {
        const proxiedURL = `/metadata?uri=${encodeURIComponent(url)}`;
        data = await fetch(proxiedURL).then(r => { return r.json() });
    }

    if (data && data.image) {
        return { image: fixImageURL(data.image), name: data.name };
    }

    return null

}
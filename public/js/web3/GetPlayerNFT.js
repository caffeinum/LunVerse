export async function getPlayerNFT(moralis) {
    const playerAddress = '0xeac41D05531770b85ad1E0f145b94BFE205bDa78'
    const result = await moralis.Web3.getNFTs({chain: 'eth', address: playerAddress, limit: '10'});
    console.log(result.length);
    const promises = result.map(async (r) => {
        if (r.token_uri) {
            let url = fixURL(r.token_uri);
            try {
                // if url is data:application/json; fetch right away
                // if not, proxy via /metadata?uri=
                let data
                if (url.startsWith("data:application/json")) {
                    data = await fetch(url).then(r => r.json());
                } else {
                    const proxiedURL = `/metadata?uri=${encodeURIComponent(url)}`;
                    data = await fetch(proxiedURL).then(r => r.json());
                }

                if (data && data.image) {
                    return { image: fixImageURL(data.image), name: data.name };
                }

            } catch (err) {
                console.log('Error with', r.token_uri, err);
            }
        }

    })
    return Promise.all(promises);
}

function fixURL(url) {
    if (url.startsWith("ipfs")) {
        return "https://ipfs.moralis.io:2053/ipfs/" + url.split("ipfs://ipfs/").slice(-1)[0];
    }
    else {
        return url;
    }
}
function fixImageURL(url) {
    if (url.startsWith("ipfs")) {
        return "https://ipfs.moralis.io:2053/ipfs/" + url.split("ipfs://").slice(-1)[0];
    } else {
        return url;
    }
}
import EthCrypto from "eth-crypto";

/*
 * @param Contract public-key, selected party
 * @return String
 */
export async function encryptVote(publicKey, party) {
	const encryptedObject = await EthCrypto.encryptWithPublicKey(
		publicKey,
		JSON.stringify(party)
	);

	// Convert the object into a smaller string
	const string = EthCrypto.cipher.stringify(encryptedObject);

	// Compress string to hex
	// const compressed = EthCrypto.hex.compress(string);

	return string;
}

export function genPubKey() {
	return EthCrypto.createIdentity().publicKey;
}



通过哈希时间锁跨智能合约的编写，可以实现以太坊链 和 其他以太坊兼容链（如BSC) 上任意资产的交换。

如：以太坊上的 Ether 交换币安链上的 USDT ，以太坊上的 ERC20 Token交换币安链上的ERC721 Token，以太坊上的ERC721 Token交换币安链上的 BNB。

实现原理:
Alice 在 A 链上有 10 个 USDT ，Bob 在 B 链上 有 1 个NFT， Alice 用一个密钥 preImage, 生成一个 hashlock = sha256(preImage) ，然后配上 时间T1 (时间过期了bob没取的话，alice 可以 取回10 USDT)，一起将 10个 USDT 放在A链上， 然后 Alice 把这个 hashlock 给 Bob, Bob用这个hashlock 和 时间T2 (T2< T1,要保证Alice取完资 产后有足够的时间去A链上取Token)将1个NFT 放在B链上。 然后Alice 去 B链上取NFT，需要输入 preImage, 取完 NFT 后，事件会抛出preImage。此时 bob 就知道这个preImage了，然后bob在A链上取走 10 Usdt。 如果 Alice 上链后没有去取NFT，那么Bob也取不到Token，T1时间结束后Alice 和 Bob 都可以取回各自的资产，实现了交易的原子性。 
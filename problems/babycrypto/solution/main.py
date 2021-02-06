import libnum
import ecdsa
import sha3
import binascii

G = ecdsa.SECP256k1.generator
order = G.order()


def gen_keypair(d):
    """
    generate a new ecdsa keypair
    """
    g = ecdsa.ecdsa.generator_secp256k1
    pub = ecdsa.ecdsa.Public_key(g, g * d)
    priv = ecdsa.ecdsa.Private_key(pub, d)
    return priv, pub


def hash_message(msg: str) -> int:
    """
    hash the message using keccak256, truncate if necessary
    """
    k = sha3.keccak_256()
    k.update(msg.encode("utf8"))
    d = k.digest()
    n = int(binascii.hexlify(d), 16)
    olen = ecdsa.ecdsa.generator_secp256k1.order().bit_length() or 1
    dlen = len(d)
    n >>= max(0, dlen - olen)
    return n


def decodehex(num):
    return int(num, 16)


def findk(m1, m2, s1, s2):
    return (((m1 - m2) % order) * libnum.invmod(
        (decodehex(s1) - decodehex(s2)), order)) % order


def main():
    message1 = hash_message('1')
    message2 = hash_message('2')
    s1 = input('s1=? ')
    r1 = input('r1=? ')
    s2 = input('s2=? ')
    k = findk(message1, message2, s1, s2)
    print(k)
    r_inv = libnum.invmod(decodehex(r1), order)
    priv_int = (r_inv * (decodehex(s1) * k - message1)) % order

    print(priv_int)
    priv, _ = gen_keypair(priv_int)

    hashed = int(input('test=? '), 16)
    print(hex(hashed))
    sig = priv.sign(hashed, k)
    print(f"r=0x{sig.r:032x}")
    print(f"s=0x{sig.s:032x}")


if __name__ == "__main__":
    main()

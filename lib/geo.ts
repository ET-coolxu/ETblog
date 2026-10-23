/**
 * 离线解析访问记录的地区。只读进程工作目录下的 `geo/dbip-city-lite.mmdb`。
 * 成功打开后在进程内复用；打开失败不缓存，补上文件后的下一次写入会重新打开。
 * 不访问网络，也不读取城市和经纬度。
 */
import "server-only";
import net from "node:net";
import path from "node:path";
import maxmind, { type CityResponse, type Reader } from "maxmind";

/** 镜像里是 `/app/geo`，本地 `npm run dev` 的工作目录是仓库根目录。不要改放到 `data/`。 */
const GEO_DB_PATH = path.join(process.cwd(), "geo", "dbip-city-lite.mmdb");

const LOCAL_PLACE = "本地";
const UNKNOWN_PLACE = "未知";

type GeoReader = Reader<CityResponse>;

const globalForGeo = globalThis as typeof globalThis & {
  geoReader?: GeoReader;
};

let opening: Promise<GeoReader | null> | null = null;

const localNetworks = new net.BlockList();
localNetworks.addSubnet("127.0.0.0", 8, "ipv4");
localNetworks.addSubnet("10.0.0.0", 8, "ipv4");
localNetworks.addSubnet("172.16.0.0", 12, "ipv4");
localNetworks.addSubnet("192.168.0.0", 16, "ipv4");
localNetworks.addSubnet("169.254.0.0", 16, "ipv4");
localNetworks.addAddress("::1", "ipv6");
localNetworks.addSubnet("fc00::", 7, "ipv6");
localNetworks.addSubnet("fe80::", 10, "ipv6");

/**
 * 判断规范化之后的地址是不是回环或内网。
 * `::ffff:` 的 IPv4 映射须已收成 IPv4；这里不再做第二次规范化。
 */
function isLocalIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) {
    return localNetworks.check(ip, "ipv4");
  }
  if (family === 6) {
    return localNetworks.check(ip, "ipv6");
  }
  return false;
}

function zhCnName(names: { readonly "zh-CN"?: string } | undefined): string | null {
  const name = names?.["zh-CN"];
  if (typeof name !== "string" || name.length === 0) {
    return null;
  }
  return name;
}

/** 只拼国家和第一级行政区。没有 zh-CN 国家名时不单存省或州。 */
function placeFromResponse(response: CityResponse | null): string {
  const country = zhCnName(response?.country?.names);
  if (!country) {
    return UNKNOWN_PLACE;
  }

  const region = zhCnName(response?.subdivisions?.[0]?.names);
  if (!region || region === country) {
    return country;
  }
  return `${country} ${region}`;
}

/**
 * 打开地区库。成功后复用同一个读取器。
 * 文件缺失或打开抛错时返回 null，并清掉进行中的 Promise，下一次调用会重新打开。
 */
function openGeoReader(): Promise<GeoReader | null> {
  if (globalForGeo.geoReader) {
    return Promise.resolve(globalForGeo.geoReader);
  }
  if (opening) {
    return opening;
  }

  opening = maxmind
    .open<CityResponse>(GEO_DB_PATH)
    .then((reader) => {
      globalForGeo.geoReader = reader;
      opening = null;
      return reader;
    })
    .catch((error: unknown) => {
      opening = null;
      console.error("打开地区库失败", error);
      return null;
    });
  return opening;
}

/**
 * 把已规范化的 IP 解析成要入库的地区字符串。
 * 回环和内网返回「本地」。公网地址只读国家和第一级行政区的 zh-CN 名称，原样拼接。
 * 库打不开、没有国家名或查询抛错时返回「未知」，不抛出。调用方仍应写入访问记录。
 * 不读取 `city` 和 `location`。
 */
export async function lookupPlace(ip: string): Promise<string> {
  if (isLocalIp(ip)) {
    return LOCAL_PLACE;
  }

  try {
    const reader = await openGeoReader();
    if (!reader) {
      return UNKNOWN_PLACE;
    }
    return placeFromResponse(reader.get(ip));
  } catch (error) {
    console.error("查询地区失败", error);
    return UNKNOWN_PLACE;
  }
}

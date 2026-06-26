const dns = require("dns");
const https = require("https");
const { execFile } = require("child_process");

const DNS_TIMEOUT_MS = 10000;
const DNS_SERVERS = ["8.8.8.8", "1.1.1.1"];

dns.setDefaultResultOrder("ipv4first");
dns.setServers(DNS_SERVERS);

const isSafeHostname = (hostname) => /^[a-zA-Z0-9._-]+$/.test(hostname);

const runNslookup = (type, hostname) =>
  new Promise((resolve, reject) => {
    if (!isSafeHostname(hostname)) {
      reject(new Error(`Unsafe DNS hostname: ${hostname}`));
      return;
    }

    execFile(
      "nslookup",
      [`-type=${type}`, hostname],
      { timeout: DNS_TIMEOUT_MS },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(stdout);
      }
    );
  });

const fetchJson = (url) =>
  new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        timeout: DNS_TIMEOUT_MS,
        headers: { accept: "application/dns-json" },
      },
      (response) => {
        let body = "";

        response.on("data", (chunk) => {
          body += chunk;
        });

        response.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("DNS-over-HTTPS request timed out"));
    });

    request.on("error", reject);
  });

const resolveWithDoh = async (type, hostname) => {
  if (!isSafeHostname(hostname)) {
    throw new Error(`Unsafe DNS hostname: ${hostname}`);
  }

  const query = new URLSearchParams({ name: hostname, type }).toString();
  const response = await fetchJson(`https://cloudflare-dns.com/dns-query?${query}`);

  if (response.Status !== 0 || !Array.isArray(response.Answer)) {
    throw new Error(`DNS-over-HTTPS failed for ${type} ${hostname}`);
  }

  return response.Answer;
};

const parseSrvNslookup = (stdout) => {
  const records = [];
  let current = {};

  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (trimmed.startsWith("priority")) {
      current.priority = Number.parseInt(trimmed.split("=").pop().trim(), 10);
    } else if (trimmed.startsWith("weight")) {
      current.weight = Number.parseInt(trimmed.split("=").pop().trim(), 10);
    } else if (trimmed.startsWith("port")) {
      current.port = Number.parseInt(trimmed.split("=").pop().trim(), 10);
    } else if (trimmed.startsWith("svr hostname")) {
      current.name = trimmed.split("=").pop().trim().replace(/\.$/, "");

      if (
        Number.isInteger(current.priority) &&
        Number.isInteger(current.weight) &&
        Number.isInteger(current.port) &&
        current.name
      ) {
        records.push(current);
        current = {};
      }
    }
  }

  return records;
};

const parseTxtNslookup = (stdout) => {
  const matches = [...stdout.matchAll(/text\s*=\s*"([^"]*)"/g)];
  return matches.map((match) => [match[1]]);
};

const parseSrvDoh = (answers) =>
  answers
    .filter((answer) => answer.type === 33 && answer.data)
    .map((answer) => {
      const [priority, weight, port, name] = answer.data.split(/\s+/);

      return {
        priority: Number.parseInt(priority, 10),
        weight: Number.parseInt(weight, 10),
        port: Number.parseInt(port, 10),
        name: name.replace(/\.$/, ""),
      };
    });

const parseTxtDoh = (answers) =>
  answers
    .filter((answer) => answer.type === 16 && answer.data)
    .map((answer) => [answer.data.replace(/^"|"$/g, "")]);

const resolveSrv = async (hostname) => {
  console.log("dnsPatch: resolveSrv", hostname);

  try {
    const records = parseSrvNslookup(await runNslookup("SRV", hostname));
    if (records.length) return records;
  } catch (error) {
    console.warn("dnsPatch: nslookup SRV failed, trying DNS-over-HTTPS");
  }

  return parseSrvDoh(await resolveWithDoh("SRV", hostname));
};

const resolveTxt = async (hostname) => {
  console.log("dnsPatch: resolveTxt", hostname);

  try {
    return parseTxtNslookup(await runNslookup("TXT", hostname));
  } catch (error) {
    console.warn("dnsPatch: nslookup TXT failed, trying DNS-over-HTTPS");
  }

  return parseTxtDoh(await resolveWithDoh("TXT", hostname));
};

dns.resolveSrv = (hostname, callback) => {
  resolveSrv(hostname).then((records) => callback(null, records)).catch(callback);
};

dns.resolveTxt = (hostname, callback) => {
  resolveTxt(hostname).then((records) => callback(null, records)).catch(callback);
};

dns.promises.resolveSrv = resolveSrv;
dns.promises.resolveTxt = resolveTxt;

console.log("dnsPatch loaded");

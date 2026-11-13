# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class PatchProof(gl.Contract):
    """A public, consensus-verified snapshot of OSV results for one package version.

    Records do not attest what a running application actually deploys. They are
    historical observations, not guarantees of security or future OSV results.
    """
    count: u64
    records: TreeMap[str, str]

    def __init__(self):
        self.count = 0

    @gl.public.write
    def compare_versions(self, ecosystem: str, package: str, before: str, after: str) -> None:
        assert ecosystem in ("npm", "PyPI"), "Unsupported ecosystem"
        assert 0 < len(package) <= 160 and 0 < len(before) <= 100 and 0 < len(after) <= 100, "Invalid package or version"
        assert all(v == v.strip() for v in (package, before, after)), "Whitespace is not allowed"
        assert before != after, "Versions must differ"

        def query(version):
            response = gl.nondet.web.request(
                "https://api.osv.dev/v1/query",
                method="POST",
                headers={"Content-Type": "application/json"},
                body=json.dumps({"package": {"ecosystem": ecosystem, "name": package}, "version": version}),
            )
            if response.status != 200 or response.body is None:
                raise gl.UserError("OSV query failed")
            data = json.loads(response.body.decode("utf-8"))
            if not isinstance(data, dict) or data.get("next_page_token"):
                raise gl.UserError("Incomplete or malformed OSV response")
            vulns = data.get("vulns", [])
            if not isinstance(vulns, list):
                raise gl.UserError("Malformed OSV response")
            ids = sorted(set(v["id"] for v in vulns if isinstance(v, dict) and isinstance(v.get("id"), str)))
            if len(ids) != len(vulns):
                raise gl.UserError("Ambiguous OSV response")
            return json.dumps(ids)

        def compare():
            return json.dumps({"before": json.loads(query(before)), "after": json.loads(query(after))}, sort_keys=True)

        result = json.loads(gl.eq_principle.strict_eq(compare))
        self.count += 1
        self.records[str(self.count)] = json.dumps({"id": int(self.count), "ecosystem": ecosystem, "package": package, "before": before, "after": after, "before_advisories": result["before"], "after_advisories": result["after"], "checked_by": str(gl.message.sender_address)})

    @gl.public.view
    def get_record(self, record_id: u64) -> str:
        return self.records.get(str(record_id), "")

    @gl.public.view
    def get_count(self) -> u64:
        return self.count

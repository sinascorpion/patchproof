import importlib.util
import json
import pathlib
import sys
import types
import unittest


class Map(dict):
    @classmethod
    def __class_getitem__(cls, item):
        return cls


class Public:
    @staticmethod
    def write(fn):
        return fn

    @staticmethod
    def view(fn):
        return fn


class FakeGL:
    Contract = object
    public = Public()
    message = types.SimpleNamespace(sender_address='0xabc')
    UserError = ValueError
    eq_principle = types.SimpleNamespace(strict_eq=lambda fn: fn())
    nondet = types.SimpleNamespace(web=types.SimpleNamespace())


module = types.ModuleType('genlayer')
module.gl = FakeGL
module.TreeMap = Map
module.u64 = int
sys.modules['genlayer'] = module
spec = importlib.util.spec_from_file_location('patchproof', pathlib.Path(__file__).parents[1] / 'contracts' / 'patchproof.py')
contract = importlib.util.module_from_spec(spec)
spec.loader.exec_module(contract)


class ContractTests(unittest.TestCase):
    def setUp(self):
        self.app = contract.PatchProof()
        self.app.records = Map()

    def test_comparison_records_normalized_advisories(self):
        def request(url, method, headers, body):
            version = json.loads(body)['version']
            ids = ['GHSA-z', 'GHSA-a'] if version == '1' else ['GHSA-z']
            return types.SimpleNamespace(status=200, body=json.dumps({'vulns': [{'id': i} for i in ids]}).encode())
        FakeGL.nondet.web.request = request
        self.app.compare_versions('npm', 'example', '1', '2')
        record = json.loads(self.app.get_record(1))
        self.assertEqual(record['before_advisories'], ['GHSA-a', 'GHSA-z'])
        self.assertEqual(record['after_advisories'], ['GHSA-z'])
        self.assertEqual(self.app.get_count(), 1)

    def test_unavailable_or_paginated_responses_do_not_create_record(self):
        for status, payload in [(503, {}), (200, {'next_page_token': 'more'})]:
            FakeGL.nondet.web.request = lambda *a, **kw: types.SimpleNamespace(status=status, body=json.dumps(payload).encode())
            with self.assertRaises(ValueError):
                self.app.compare_versions('npm', 'example', '1', '2')
            self.assertEqual(self.app.get_count(), 0)

    def test_rejects_same_version(self):
        with self.assertRaises(AssertionError):
            self.app.compare_versions('npm', 'example', '1', '1')


if __name__ == '__main__':
    unittest.main()


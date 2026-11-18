import copy
import json
import linecache
import sys
import traceback
from types import ModuleType


def error_text():
    return traceback.format_exc(limit=6)[-3500:]


def compiled(text, filename):
    linecache.cache[filename] = (len(text), None, text.splitlines(keepends=True), filename)
    return compile(text, filename, "exec")


def prepare(payload):
    global task, call, accepts, namespace, script
    task = json.loads(payload)
    module = ModuleType("__main__" if task["stdio"] else "submission")
    sys.modules[module.__name__] = module
    namespace = module.__dict__
    try:
        script = compiled(task["code"], "submission.py")
        if task["stdio"]:
            namespace["__file__"] = "submission.py"
            sys.argv = ["submission.py"]
            return ""
        if task["prelude"]:
            exec(compiled(task["prelude"], "<题目提供的类型>"), namespace)
        exec(script, namespace)
        accepts = None
        if task["driver"]:
            namespace.pop("accepts", None)
            exec(compiled(task["driver"], "<题目测试入口>"), namespace)
            call = namespace["run_case"]
            accepts = namespace.get("accepts")
        else:
            solve = namespace["solve"]
            call = lambda args: solve(*args)
    except BaseException:
        return error_text()
    return ""


def numpy_json(value):
    numpy = sys.modules.get("numpy")
    if numpy is not None and isinstance(value, (numpy.ndarray, numpy.generic)):
        return value.tolist()
    raise TypeError("请返回可转换为 JSON 的结果：" + type(value).__name__)


def function_case(i):
    case = task["cases"][i]
    try:
        actual = call(copy.deepcopy(case["args"]))
        record = {"actual": actual}
        if accepts is not None:
            record["accepted"] = bool(accepts(case["args"], actual, case["expected"]))
        result = json.dumps(record, allow_nan=False, default=numpy_json)
        if len(result) > 2 * 1024 * 1024:
            raise ValueError("函数返回值过大，请核对输出的形状。")
        return result
    except BaseException:
        return json.dumps({"error": error_text()})


def stdio_case():
    try:
        exec(script, namespace)
    except SystemExit as exc:
        if exc.code not in (None, 0):
            return error_text()
    except BaseException:
        return error_text()
    finally:
        sys.stdout.flush()
        sys.stderr.flush()
    return ""

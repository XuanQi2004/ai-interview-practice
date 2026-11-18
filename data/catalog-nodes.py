"""供题单中使用链表和二叉树的 Python 作答与评测入口共用。"""
from collections import deque


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def list_from(values):
    sentinel = tail = ListNode()
    for value in values:
        tail.next = ListNode(value)
        tail = tail.next
    return sentinel.next


def list_values(head):
    values = []
    visited = set()
    while head is not None:
        if id(head) in visited:
            raise ValueError("返回的链表含环，此题期望一条以 None 结尾的链表。")
        visited.add(id(head))
        values.append(head.val)
        head = head.next
    return values


def tree_from(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    parents = deque([root])
    index = 1
    while parents and index < len(values):
        parent = parents.popleft()
        for field in ("left", "right"):
            if index == len(values):
                return root
            value = values[index]
            index += 1
            if value is not None:
                child = TreeNode(value)
                setattr(parent, field, child)
                parents.append(child)
    return root


def tree_values(root):
    values = []
    visited = set()
    queue = deque([root])
    while queue:
        node = queue.popleft()
        if node is None:
            values.append(None)
            continue
        if id(node) in visited:
            raise ValueError("多个位置引用同一节点，请检查子树连接。")
        visited.add(id(node))
        values.append(node.val)
        queue.extend((node.left, node.right))
    while values and values[-1] is None:
        values.pop()
    return values
